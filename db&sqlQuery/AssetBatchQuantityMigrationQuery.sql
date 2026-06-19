BEGIN TRANSACTION;
BEGIN TRY
 
    -- =========================================================================
    --  GUARD: Verify schema migration has already run
    -- =========================================================================
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'Asset' AND COLUMN_NAME = 'BatchId'
    )
    BEGIN
        RAISERROR('BatchId column missing on Asset table. Run AddAssetBatchSupport migration first.', 16, 1);
        ROLLBACK TRANSACTION; RETURN;
    END;
 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AssetBatch')
    BEGIN
        RAISERROR('AssetBatch table missing. Run AddAssetBatchSupport migration first.', 16, 1);
        ROLLBACK TRANSACTION; RETURN;
    END;
 
    IF NOT EXISTS (SELECT 1 FROM Asset WHERE BatchId IS NULL)
    BEGIN
        PRINT 'Nothing to migrate — all Asset rows already have BatchId set.';
        COMMIT TRANSACTION; RETURN;
    END;
 
    -- =========================================================================
    --  STEP 1
    --  Snapshot the ORIGINAL values of every unbatched asset row BEFORE we
    --  change anything. We capture:
    --    Qty       — because we overwrite Quantity = 1 in Step 5
    --    Cancelled — because new unit rows must inherit this from their parent
    -- =========================================================================
    CREATE TABLE #OriginalQty (
        AssetId   BIGINT NOT NULL PRIMARY KEY,
        Qty       INT    NOT NULL,
        Cancelled BIT    NOT NULL    -- ← NEW: track per-asset cancelled state
    );
 
    INSERT INTO #OriginalQty (AssetId, Qty, Cancelled)
    SELECT
        Id,
        ISNULL(Quantity, 1),
        ISNULL(Cancelled, 0)     -- snapshot the current cancelled flag
    FROM Asset
    WHERE BatchId IS NULL;       -- ALL assets, both active and cancelled
 
    -- =========================================================================
    --  STEP 2
    --  Build one group per (OrganizationId, Name, Category, SubCategory).
    --  Includes BOTH active and cancelled assets — each group gets one batch.
    --
    --  TotalRows  = all rows (active + cancelled) → becomes OriginalQuantity
    --  ActiveRows = only non-cancelled rows         → becomes ActiveQuantity
    -- =========================================================================
    CREATE TABLE #Groups (
        GroupKey       NVARCHAR(MAX)    NOT NULL,
        OrganizationId UNIQUEIDENTIFIER NOT NULL,
        AssetName      NVARCHAR(500)    NOT NULL,
        Category       BIGINT           NULL,
        SubCategory    BIGINT           NULL,
        ImageUrl       NVARCHAR(500)    NULL,
        Description    NVARCHAR(500)    NULL,
        CreatedBy      NVARCHAR(256)    NOT NULL,
        ModifiedBy     NVARCHAR(256)    NOT NULL,
        CreatedDate    DATETIME2        NOT NULL,
        ModifiedDate   DATETIME2        NOT NULL,
        TotalRows      INT              NOT NULL,
        ActiveRows     INT              NOT NULL,
        RowNum         INT              NULL,
        BatchCode      NVARCHAR(60)     NULL,
        BatchId        BIGINT           NULL
    );
 
    INSERT INTO #Groups (
        GroupKey, OrganizationId, AssetName, Category, SubCategory,
        ImageUrl, Description, CreatedBy, ModifiedBy,
        CreatedDate, ModifiedDate, TotalRows, ActiveRows
    )
    SELECT
        CAST(a.OrganizationId AS NVARCHAR(36))
            + '|' + ISNULL(a.Name, '')
            + '|' + ISNULL(CAST(a.Category    AS NVARCHAR(20)), 'NULL')
            + '|' + ISNULL(CAST(a.SubCategory AS NVARCHAR(20)), 'NULL') AS GroupKey,
        a.OrganizationId,
        ISNULL(a.Name, 'Unnamed Asset')                                  AS AssetName,
        a.Category,
        a.SubCategory,
        MAX(a.ImageUrl)                                                  AS ImageUrl,
        MAX(a.Description)                                               AS Description,
        MIN(a.CreatedBy)                                                 AS CreatedBy,
        MIN(a.ModifiedBy)                                                AS ModifiedBy,
        MIN(a.CreatedDate)                                               AS CreatedDate,
        MAX(a.ModifiedDate)                                              AS ModifiedDate,
        -- TotalRows sums the ORIGINAL Quantities (not row count), because one old row
        -- with Quantity=5 represents 5 physical units.
        SUM(ISNULL(a.Quantity, 1))                                       AS TotalRows,
        -- ActiveRows: sum quantities of NON-cancelled rows only
        SUM(CASE WHEN a.Cancelled = 0 THEN ISNULL(a.Quantity, 1) ELSE 0 END) AS ActiveRows
    FROM Asset a
    WHERE a.BatchId IS NULL   -- ALL unbatched assets, active AND cancelled
    GROUP BY
        a.OrganizationId,
        a.Name,
        a.Category,
        a.SubCategory;
 
    -- =========================================================================
    --  STEP 3
    --  Per-org sequential numbers and unique BatchCodes.
    -- =========================================================================
    ;WITH N AS (
        SELECT GroupKey,
               ROW_NUMBER() OVER (PARTITION BY OrganizationId ORDER BY CreatedDate, AssetName) AS RN
        FROM #Groups
    )
    UPDATE g SET g.RowNum = n.RN
    FROM #Groups g INNER JOIN N n ON n.GroupKey = g.GroupKey;
 
    UPDATE #Groups SET BatchCode =
        'BATCH-LEGACY-'
        + LEFT(REPLACE(CAST(OrganizationId AS NVARCHAR(36)), '-', ''), 8)
        + '-'
        + RIGHT('0000' + CAST(RowNum AS NVARCHAR(4)), 4);
 
    -- =========================================================================
    --  STEP 4
    --  Create AssetBatch rows.
    --  OriginalQuantity and ActiveQuantity are calculated correctly from
    --  actual unit counts (sum of Quantity fields, not row counts).
    --  Step 9 will recalculate them again after expansion for final accuracy.
    -- =========================================================================
    INSERT INTO AssetBatch (
        BatchCode, AssetName, Category, SubCategory, Description, ImageUrl,
        OriginalQuantity, ActiveQuantity,
        OrganizationId, CreatedDate, ModifiedDate, CreatedBy, ModifiedBy, Cancelled
    )
    SELECT
        g.BatchCode, g.AssetName, g.Category, g.SubCategory, g.Description, g.ImageUrl,
        g.TotalRows,    -- total physical units (sum of Quantity)
        g.ActiveRows,   -- active physical units (Cancelled=0 rows, sum of Quantity)
        g.OrganizationId, g.CreatedDate, g.ModifiedDate, g.CreatedBy, g.ModifiedBy,
        -- The batch itself is cancelled only if ALL units in the group are cancelled
        CASE WHEN g.ActiveRows = 0 THEN 1 ELSE 0 END   AS Cancelled
    FROM #Groups g;
 
    -- Match back generated batch IDs
    UPDATE g SET g.BatchId = ab.Id
    FROM #Groups g INNER JOIN AssetBatch ab ON ab.BatchCode = g.BatchCode;
 
    -- =========================================================================
    --  STEP 5
    --  Stamp BatchId + BatchSequence onto every original Asset row.
    --  Set Quantity = 1 (each row = one physical unit going forward).
    --  Cancelled status of original rows is NEVER touched.
    -- =========================================================================
    ;WITH Ranked AS (
        SELECT
            a.Id,
            a.OrganizationId,
            ISNULL(a.Name, '')  AS AssetName,
            a.Category,
            a.SubCategory,
            ROW_NUMBER() OVER (
                PARTITION BY a.OrganizationId, ISNULL(a.Name,''), a.Category, a.SubCategory
                ORDER BY a.Cancelled, a.Id   -- active rows (Cancelled=0) get lower sequences
            ) AS Seq
        FROM Asset a
        WHERE a.BatchId IS NULL
    )
    UPDATE a
    SET
        a.BatchId       = g.BatchId,
        a.BatchSequence = r.Seq,
        a.Quantity      = 1         -- each row = 1 physical unit from now on
        -- NOTE: a.Cancelled is deliberately NOT touched here
    FROM Asset a
    INNER JOIN Ranked r ON r.Id = a.Id
    INNER JOIN #Groups g
        ON  g.OrganizationId = r.OrganizationId
        AND g.AssetName      = r.AssetName
        AND (g.Category    = r.Category    OR (g.Category    IS NULL AND r.Category    IS NULL))
        AND (g.SubCategory = r.SubCategory OR (g.SubCategory IS NULL AND r.SubCategory IS NULL));
 
    -- =========================================================================
    --  STEP 6
    --  Build the expansion table for assets with original Quantity > 1.
    --  Each row in #Expand represents one NEW unit that needs to be created.
    --  The new unit inherits Cancelled from its parent (reference) row.
    --
    --  Example:
    --    Reference row Cancelled=0, Qty=5 → creates 4 new rows with Cancelled=0
    --    Reference row Cancelled=1, Qty=5 → creates 4 new rows with Cancelled=1
    --    (all units of a cancelled purchase are treated as cancelled)
    -- =========================================================================
    CREATE TABLE #Expand (
        Rn               BIGINT           NOT NULL,   -- global sequence for AssetId generation
        RefAssetId       BIGINT           NOT NULL,   -- original Asset.Id (unit 1)
        BatchId          BIGINT           NOT NULL,
        BatchSeq         INT              NOT NULL,   -- 2..N
        OrganizationId   UNIQUEIDENTIFIER NOT NULL,
        -- ← NEW: track whether this new unit should be created as cancelled
        RefCancelled     BIT              NOT NULL,
        AssetBrand       NVARCHAR(200)    NULL,
        AssetModelNo     NVARCHAR(200)    NULL,
        BaseSerial       NVARCHAR(200)    NULL,
        Name             NVARCHAR(500)    NULL,
        Description      NVARCHAR(500)    NULL,
        Category         BIGINT           NULL,
        SubCategory      BIGINT           NULL,
        UnitPrice        FLOAT            NULL,
        Supplier         BIGINT           NULL,
        Department       BIGINT           NULL,
        SubDepartment    BIGINT           NULL,
        WarranetyInMonth INT              NULL,
        IsDepreciable    BIT              NULL,
        DepreciableCost  DECIMAL(18,2)    NULL,
        SalvageValue     DECIMAL(18,2)    NULL,
        DepreciationInMonth INT           NULL,
        DepreciationMethod  INT           NULL,
        DateAquired      DATETIME2        NULL,
        ImageUrl         NVARCHAR(500)    NULL,
        DeliveryNote     NVARCHAR(500)    NULL,
        PurchaseReceipt  NVARCHAR(500)    NULL,
        Invoice          NVARCHAR(500)    NULL,
        DateOfPurchase   DATETIME2        NULL,
        DateOfManufacture DATETIME2       NULL,
        YearOfValuation  DATETIME2        NULL,
        AssetType        INT              NULL,
        AssetStatus      BIGINT           NULL,
        ApproverType     INT              NULL,
        Note             NVARCHAR(MAX)    NULL,
        CreatedBy        NVARCHAR(256)    NOT NULL,
        ModifiedBy       NVARCHAR(256)    NOT NULL,
        GeneratedAssetId NVARCHAR(50)     NULL,        -- set in Step 7
		RefCreatedDate   NVARCHAR(8)      NULL,       -- yyyyMMdd from original asset CreatedDat
		RefCreatedDate2  DATETIME2  NULL,
		RefModifiedDate  DATETIME2  NULL
    );
 
    ;WITH Tally(N) AS (
        SELECT TOP (
            SELECT ISNULL(SUM(oq.Qty - 1), 0)
            FROM #OriginalQty oq
            INNER JOIN Asset a ON a.Id = oq.AssetId
            WHERE a.BatchId IS NOT NULL   -- linked in Step 5
              AND oq.Qty > 1
        )
        ROW_NUMBER() OVER (ORDER BY (SELECT NULL))
        FROM sys.columns c1 CROSS JOIN sys.columns c2
    )
    INSERT INTO #Expand (
        Rn, RefAssetId, BatchId, BatchSeq,
        OrganizationId,
        RefCancelled,    -- ← NEW
        AssetBrand, AssetModelNo, BaseSerial,
        Name, Description, Category, SubCategory,
        UnitPrice, Supplier, Department, SubDepartment,
        WarranetyInMonth, IsDepreciable, DepreciableCost, SalvageValue,
        DepreciationInMonth, DepreciationMethod, DateAquired,
        ImageUrl, DeliveryNote, PurchaseReceipt, Invoice,
        DateOfPurchase, DateOfManufacture, YearOfValuation,
        AssetType, AssetStatus, ApproverType,
        Note, CreatedBy, ModifiedBy, RefCreatedDate, RefCreatedDate2, RefModifiedDate
    )
    SELECT
        ROW_NUMBER() OVER (ORDER BY a.Id, t.N)  AS Rn,
        a.Id                                     AS RefAssetId,
        a.BatchId,
        a.BatchSequence + t.N                    AS BatchSeq,   -- 2, 3, ... N
        a.OrganizationId,
        ISNULL(a.Cancelled, 0)                   AS RefCancelled,  -- ← inherit from parent
        a.AssetBrand, a.AssetModelNo,
        ISNULL(a.AssetSerialNo, 'SN')            AS BaseSerial,
        a.Name, a.Description, a.Category, a.SubCategory,
        a.UnitPrice, a.Supplier,
        -- SiteId / AreaId deliberately omitted:
        --   Cancelled units → no location needed
        --   Active extra units → NotAssigned, no site yet
        a.Department, a.SubDepartment,
        a.WarranetyInMonth,
        a.IsDepreciable, a.DepreciableCost, a.SalvageValue,
        a.DepreciationInMonth, a.DepreciationMethod, a.DateAquired,
        a.ImageUrl, a.DeliveryNote, a.PurchaseReceipt, a.Invoice,
        a.DateOfPurchase, a.DateOfManufacture, a.YearOfValuation,
        a.AssetType, a.AssetStatus, a.ApproverType,
        a.Note, a.CreatedBy, a.ModifiedBy, CONVERT(NVARCHAR(8), a.CreatedDate, 112)  AS RefCreatedDate,
		a.CreatedDate  AS RefCreatedDate2,
		a.ModifiedDate AS RefModifiedDate
    FROM Asset a
    INNER JOIN #OriginalQty oq ON oq.AssetId = a.Id
    INNER JOIN Tally t         ON t.N <= (oq.Qty - 1)
    WHERE a.BatchId IS NOT NULL   -- only assets linked in Step 5
      AND oq.Qty > 1;             -- only those needing expansion
 
-- =========================================================================
--  STEP 7 (FIXED)
--  Use NVARCHAR(20) not NVARCHAR(7) to avoid overflow.
--  Use RefCreatedDate (original asset date) not today's date.
--  Then trim to last 7 digits to keep the format consistent.
-- =========================================================================
    DECLARE @MaxId BIGINT      = (SELECT ISNULL(MAX(Id), 0) FROM Asset);
    DECLARE @Today NVARCHAR(8) = CONVERT(NVARCHAR(8), GETDATE(), 112);
    DECLARE @Now   DATETIME2   = GETDATE();
 
	UPDATE e
	SET e.GeneratedAssetId =
	    e.RefCreatedDate 
		+ RIGHT('0000000' + CAST(@MaxId + e.Rn AS NVARCHAR(20)), 7)
	    + RIGHT('00' + CAST((ABS(CHECKSUM(NEWID())) % 90) + 10 AS NVARCHAR(2)), 2)
	FROM #Expand e;
 
    -- Duplicate check within generated IDs
    IF EXISTS (
        SELECT GeneratedAssetId FROM #Expand
        GROUP BY GeneratedAssetId HAVING COUNT(*) > 1
    )
    BEGIN
        RAISERROR('Duplicate AssetId generated — re-run the migration.', 16, 1);
        ROLLBACK TRANSACTION; RETURN;
    END;
 
    -- Collision check against existing Asset rows
    IF EXISTS (
        SELECT 1 FROM #Expand e
        INNER JOIN Asset a ON a.AssetId = e.GeneratedAssetId
    )
    BEGIN
        RAISERROR('Generated AssetId already exists in Asset table — re-run.', 16, 1);
        ROLLBACK TRANSACTION; RETURN;
    END;
 
    -- =========================================================================
    --  STEP 8
    --  INSERT new unit rows.
    --
    --  KEY RULES for each column based on RefCancelled:
    --
    --  RefCancelled = 0 (active parent):
    --    Cancelled  = 0   (unit is active)
    --    IsAvilable = 1   (unit is available, not yet assigned)
    --    AssignTo   = 0   (NotAssigned — admin must assign individually)
    --    SiteId     = NULL, AreaId = NULL, AssignUserId = NULL
    --
    --  RefCancelled = 1 (deleted parent):
    --    Cancelled  = 1   (unit is deleted — mirrors the parent's state)
    --    IsAvilable = 0   (not available — it was deleted)
    --    AssignTo   = 0   (NotAssigned — doesn't matter, it's cancelled)
    --    SiteId     = NULL, AreaId = NULL, AssignUserId = NULL
    -- =========================================================================
    INSERT INTO Asset (
        BatchId, BatchSequence,
        AssetId, AssetBrand, AssetModelNo, AssetSerialNo,
        Name, Description, Category, SubCategory,
        Quantity, UnitPrice, Supplier,
        SiteId, AreaId,               -- always NULL for new units
        Department, SubDepartment,
        WarranetyInMonth,
        IsDepreciable, DepreciableCost, SalvageValue,
        DepreciationInMonth, DepreciationMethod, DateAquired,
        ImageUrl, DeliveryNote, PurchaseReceipt, Invoice,
        DateOfPurchase, DateOfManufacture, YearOfValuation,
        AssetType,
        AssignTo,       -- always 0 (NotAssigned) — extra units need individual assignment
        AssignUserId,   -- always NULL
        AssetAssignedId,-- always NULL
        AssetStatus, ApproverType, TransferAppStatus,
        Qrcode,         -- = GeneratedAssetId (text)
        Barcode,        -- = GeneratedAssetId (text)
        QrcodeImage,    -- NULL — background service generates PNG on app start
        IsAvilable,     -- ← depends on RefCancelled
        Note,
        OrganizationId,
        CreatedDate, ModifiedDate, CreatedBy, ModifiedBy,
        Cancelled       -- ← inherited from parent (RefCancelled)
    )
    SELECT
        e.BatchId,
        e.BatchSeq,
        e.GeneratedAssetId,
        e.AssetBrand,
        e.AssetModelNo,
        -- Unique serial: parent serial + '-002', '-003', ...
        e.BaseSerial + '-' + RIGHT('00000' + CAST(e.BatchSeq AS NVARCHAR(10)), 5),
        e.Name, e.Description, e.Category, e.SubCategory,
        1,              -- Quantity = 1 (one physical unit per row)
        e.UnitPrice, e.Supplier,
        NULL,           -- SiteId = NULL (NotAssigned)
        NULL,           -- AreaId = NULL
        e.Department, e.SubDepartment,
        e.WarranetyInMonth,
        e.IsDepreciable, e.DepreciableCost, e.SalvageValue,
        e.DepreciationInMonth, e.DepreciationMethod, e.DateAquired,
        e.ImageUrl, e.DeliveryNote, e.PurchaseReceipt, e.Invoice,
        e.DateOfPurchase, e.DateOfManufacture, e.YearOfValuation,
        e.AssetType,
        0,              -- AssignTo = NotAssigned (0)
        NULL,           -- AssignUserId = NULL
        NULL,           -- AssetAssignedId = NULL
        e.AssetStatus, e.ApproverType,
        2,              -- TransferAppStatus = Approved
 
        e.GeneratedAssetId,     -- Qrcode text = AssetId
        NULL,					-- BarcodeImage = NULL (background service fills this)
        NULL,                   -- QrcodeImage = NULL (background service fills this)
 
        -- IsAvilable: 0 if parent was cancelled, 1 if parent was active
        CASE WHEN e.RefCancelled = 1 THEN 0 ELSE 1 END,
 
        e.Note,
        e.OrganizationId,
        e.RefCreatedDate2, @Now, e.CreatedBy, e.ModifiedBy,
 
        -- Cancelled: inherit from parent row (THE KEY FIX for your question)
        e.RefCancelled
 
    FROM #Expand e;
 
    -- =========================================================================
    --  STEP 9
    --  Recalculate AssetBatch OriginalQuantity and ActiveQuantity from actual
    --  row counts now that expansion is complete.
    --  This gives the exact final values.
    -- =========================================================================
    UPDATE ab
    SET
        ab.OriginalQuantity = (
            SELECT COUNT(*) FROM Asset a
            WHERE a.BatchId = ab.Id
              AND a.OrganizationId = ab.OrganizationId
            -- count ALL rows (active + cancelled) = total units ever in this batch
        ),
        ab.ActiveQuantity = (
            SELECT COUNT(*) FROM Asset a
            WHERE a.BatchId = ab.Id
              AND a.OrganizationId = ab.OrganizationId
              AND a.Cancelled = 0     -- only non-cancelled units
        )
    FROM AssetBatch ab
    WHERE ab.BatchCode LIKE 'BATCH-LEGACY-%';
 
    -- Also fix the AssetBatch.Cancelled flag based on final ActiveQuantity
    UPDATE AssetBatch
    SET Cancelled = CASE WHEN ActiveQuantity = 0 THEN 1 ELSE 0 END
    WHERE BatchCode LIKE 'BATCH-LEGACY-%';
 
    -- =========================================================================
    --  STEP 10
    --  AssetHistory for newly created unit rows.
    --  Add entries for both active AND cancelled new units so history is complete.
    -- =========================================================================
    INSERT INTO AssetHistory (
        AssetId, AssignUserId, Action,
        OrganizationId, CreatedDate, ModifiedDate, CreatedBy, ModifiedBy, Cancelled
    )
    SELECT
        a.Id,
        NULL,
        CASE
            WHEN a.Cancelled = 1
            THEN 'Unit created by legacy batch migration (cancelled — parent asset was deleted)'
            ELSE 'Unit created by legacy batch migration'
        END,
        a.OrganizationId,
        @Now, @Now, a.CreatedBy, a.ModifiedBy,
        0    -- history entries themselves are never cancelled
    FROM Asset a
    INNER JOIN AssetBatch ab ON ab.Id = a.BatchId
    WHERE ab.BatchCode LIKE 'BATCH-LEGACY-%'
      AND a.BatchSequence > 1;   -- only the NEW rows created by this migration
 
    -- =========================================================================
    --  STEP 11 — Cleanup
    -- =========================================================================
    DROP TABLE IF EXISTS #OriginalQty;
    DROP TABLE IF EXISTS #Groups;
    DROP TABLE IF EXISTS #Expand;
 
    -- =========================================================================
    --  STEP 12 — Verification summary
    --  Read this output carefully after running.
    --  StillUnbatched_MustBeZero MUST be 0 — if not, something went wrong.
    -- =========================================================================
    SELECT
        'Migration complete'                                                            AS Status,
        (SELECT COUNT(*) FROM AssetBatch WHERE BatchCode LIKE 'BATCH-LEGACY-%')        AS BatchesCreated,
        (SELECT COUNT(*) FROM AssetBatch WHERE BatchCode LIKE 'BATCH-LEGACY-%'
            AND Cancelled = 0)                                                         AS ActiveBatches,
        (SELECT COUNT(*) FROM AssetBatch WHERE BatchCode LIKE 'BATCH-LEGACY-%'
            AND Cancelled = 1)                                                         AS FullyCancelledBatches,
        (SELECT COUNT(*) FROM Asset WHERE BatchId IS NOT NULL AND BatchSequence = 1)   AS OriginalUnit1Rows,
        (SELECT COUNT(*) FROM Asset WHERE BatchId IS NOT NULL AND BatchSequence > 1
            AND Cancelled = 0)                                                         AS NewActiveUnitsCreated,
        (SELECT COUNT(*) FROM Asset WHERE BatchId IS NOT NULL AND BatchSequence > 1
            AND Cancelled = 1)                                                         AS NewCancelledUnitsCreated,
        (SELECT COUNT(*) FROM Asset WHERE BatchId IS NULL)                             AS StillUnbatched_MustBeZero,
        (SELECT COUNT(*) FROM Asset WHERE QrcodeImage IS NULL
            AND BatchId IS NOT NULL AND BatchSequence > 1
            AND Cancelled = 0)                                                         AS ActiveUnitsAwaitingQrRegen;
 
    COMMIT TRANSACTION;
    PRINT 'Migration completed successfully.';
 
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
 
    DROP TABLE IF EXISTS #OriginalQty;
    DROP TABLE IF EXISTS #Groups;
    DROP TABLE IF EXISTS #Expand;
 
    DECLARE @ErrMsg  NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrSev  INT            = ERROR_SEVERITY();
    DECLARE @ErrLine INT            = ERROR_LINE();
    PRINT 'Migration FAILED at line ' + CAST(@ErrLine AS NVARCHAR(10)) + ': ' + @ErrMsg;
    RAISERROR(@ErrMsg, @ErrSev, 1);
END CATCH;