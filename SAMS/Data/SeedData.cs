using SAMS.Models;

namespace SAMS.Data
{
    public class SeedData
    {
        public IEnumerable<ManageUserRole> GetManageRoleList()
        {
            return new List<ManageUserRole>
            {
                new ManageUserRole { Name = "Admin", Description = "User Role: New"},
                new ManageUserRole { Name = "General", Description = "User Role: General"},
            };
        }

        public IEnumerable<Industries> GetDefaultIndustriesList()
        {
            return new List<Industries>
            {
                new Industries { Name = "IT & Technology", Description = "Includes companies engaged in software, hardware, IT services, and digital transformation solutions." },
                new Industries { Name = "Manufacturing", Description = "Covers organizations involved in production, assembly, and supply chain operations across various sectors." },
                new Industries { Name = "Healthcare", Description = "Represents hospitals, clinics, pharmaceuticals, medical devices, and health service providers." },
                new Industries { Name = "Government & Public Sector", Description = "Includes federal, state, and local government agencies, public utilities, and NGOs." },
                new Industries { Name = "Transportation & Logistics", Description = "Focuses on freight, delivery, and transportation management companies." },
                new Industries { Name = "Education", Description = "Covers schools, universities, training centers, and educational technology institutions." },
                new Industries { Name = "Construction", Description = "Includes companies in building, civil engineering, and infrastructure development." },
                new Industries { Name = "Retail & Warehousing", Description = "Represents businesses in retail trade, distribution, and storage management." },
                new Industries { Name = "Hospitality & Food Services", Description = "Includes hotels, restaurants, catering, and leisure service providers." }
            };
        }

    }
}
