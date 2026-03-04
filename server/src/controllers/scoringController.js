const {readData}=require("../utils/file.util");

const score= async(req,res)=>{
    try{
        let earnedScore=0;
        let totalWeight=0;
        const userData=req.body;

        const roleData=await readData();
        const matchedRole=roleData.roles.find(r=>r.role===userData.role);
        if(!matchedRole){
            return res.status(404).json({message:"Role not found"});

        }
        matchedRole.skills.forEach(role => {
            // use the correct weight property
            totalWeight += role.weight;
            const userSkill = userData.skills.find(skill => skill.name === role.name);
            if (userSkill) {
                earnedScore += (userSkill.level / role.requiredLevel) * role.weight;
            }
        });
        const finalScore=(earnedScore/totalWeight)*100;
        res.status(200).json({message:"success",finalScore})

    }catch(error){
        res.status(500).json({message:"internal server error"});
    }
}
module.exports={score};