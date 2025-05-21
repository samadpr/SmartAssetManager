using System.ComponentModel.DataAnnotations;

namespace SAMS.Models
{
    public class EntityBase
    {
        //[Display(Name = "Created Date")]
        [DisplayFormat(DataFormatString = "{0:MM/dd/yyyy}")]
        public DateTime CreatedDate { get; set; }
        [DisplayFormat(DataFormatString = "{0:MM/dd/yyyy}")]
        public DateTime ModifiedDate { get; set; }

        public string CreatedBy { get; set; }
        public string ModifiedBy { get; set; }
        public bool Cancelled { get; set; }
    }
}
