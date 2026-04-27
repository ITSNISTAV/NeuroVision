const {readData}=require("../utils/role.util");
const { readData: readProfileData } = require("../utils/file.util");

const score= async(req,res)=>{
    try{
        const userId = req.params.userId;
        const { role } = req.body;

        if (!userId || !role) {
            return res.status(400).json({ message: "userId and role are required" });
        }

        if (userId === "guest") {
            return res.status(401).json({ message: "User not authenticated. Please login first." });
        }

        // Get user profile data from profile.json
        const profileData = readProfileData();
        const user = profileData.users.find(u => u.id === userId);

        if (!user) {
            return res.status(404).json({ message: "User profile not found" });
        }

        // Find the specific role in user's profile
        const userRole = user.roles.find(r => r.role === role);
        if (!userRole) {
            return res.status(404).json({ message: "Role not found in user profile" });
        }

        // Ensure technical skills exist
        if (!userRole.technicalSkills || userRole.technicalSkills.length === 0) {
            return res.status(400).json({ message: "No technical skills found for this role" });
        }

        let earnedScore=0;
        let totalWeight=0;

        const roleData=await readData();
        const matchedRole=roleData.roles.find(r=>r.role===role);
        if(!matchedRole){
            return res.status(404).json({message:"Role definition not found"});
        }

        matchedRole.skills.forEach(roleSkill => {
            totalWeight += roleSkill.weight;
            const userSkill = userRole.technicalSkills.find(skill => skill.skill === roleSkill.name);
            if (userSkill) {
                // Cap skill contribution at 100% (don't exceed required level)
                const skillPercentage = Math.min(userSkill.level / roleSkill.requiredLevel, 1);
                earnedScore += skillPercentage * roleSkill.weight;
            }
        });
        const finalScore = totalWeight ? Math.min((earnedScore / totalWeight) * 100, 100) : 0;
        res.status(200).json({ message: "success", finalScore });

    }catch(error){
        console.error("Scoring error:", error);
        res.status(500).json({message:"Internal server error", error: error.message});
    }
}
module.exports={score};