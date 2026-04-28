const {readData}=require("../utils/role.util");
const { readData: readProfileData } = require("../utils/file.util");

const score= async(req,res)=>{
    try{
        const userId = req.params.userId;
        const { role } = req.body;

        if (!userId || !role) {
            return res.status(400).json({ message: "userId and role are required" });
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

        let earnedScore=0;
        let totalWeight=0;

        const roleData=await readData();
        const matchedRole=roleData.roles.find(r=>r.role===role);
        if(!matchedRole){
            return res.status(404).json({message:"Role not found"});

        }
        matchedRole.skills.forEach(roleSkill => {
            // use the correct weight property
            totalWeight += roleSkill.weight;
            const userSkill = userRole.technicalSkills.find(skill => skill.skill === roleSkill.name);
            if (userSkill) {
                earnedScore += (userSkill.level / roleSkill.requiredLevel) * roleSkill.weight;
            }
        });
        const finalScore = totalWeight ? (earnedScore / totalWeight) * 100 : 0;
        res.status(200).json({ message: "success", finalScore });

    }catch(error){
        res.status(500).json({message:"internal server error"});
    }
}
module.exports={score};