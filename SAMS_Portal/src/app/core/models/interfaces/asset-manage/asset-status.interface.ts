export interface AssetStatusDto {
  id: number;
  name: string;
  description?: string;

  // 🔥 Enterprise extensibility
  isSystem: boolean;     // enum-based or user-defined
  enumValue?: number;   // maps to backend enum when isSystem = true
}
