const Role = require("../models/roleData.schema"); 
const User = require("../models/User"); // Import your User Mongoose model

const score = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { role } = req.body;

        // 1. Basic Validation
        if (!userId || !role) {
            return res.status(400).json({ message: "userId and role are required" });
        }

        if (userId === "guest") {
            return res.status(401).json({ message: "User not authenticated. Please login first." });
        }

        // 2. DATABASE CHANGE: Fetch user profile from MongoDB
        // We use findById to fetch the specific user document
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User profile not found" });
        }

        // 3. Find the role within the user's document
        const userRole = user.roles.find(r => r.role === role);
        if (!userRole) {
            return res.status(404).json({ message: "Role not found in user profile" });
        }

        if (!userRole.technicalSkills || userRole.technicalSkills.length === 0) {
            return res.status(400).json({ message: "No technical skills found for this role" });
        }

        // 4. Fetch the specific role definition from MongoDB
        const matchedRole = await Role.findOne({ role: role });
        
        if (!matchedRole) {
            return res.status(404).json({ message: "Role definition not found in database" });
        }

        // 5. Calculate Score
        let earnedScore = 0;
        let totalWeight = 0;

        matchedRole.skills.forEach(roleSkill => {
            totalWeight += roleSkill.weight;
            
            // Matches user skills against the role definition
            const userSkill = userRole.technicalSkills.find(
                skill => skill.skill.toLowerCase() === roleSkill.name.toLowerCase()
            );

            if (userSkill) {
                const skillPercentage = Math.min(userSkill.level / roleSkill.requiredLevel, 1);
                earnedScore += skillPercentage * roleSkill.weight;
            }
        });

        const finalScore = totalWeight ? Math.min((earnedScore / totalWeight) * 100, 100) : 0;

        res.status(200).json({ 
            message: "success", 
            finalScore: Math.round(finalScore * 100) / 100 
        });

    } catch (error) {
        console.error("Scoring error:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

module.exports = { score };