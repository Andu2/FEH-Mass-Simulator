<?php require("dbHeroes.php");

if (isset($_REQUEST["action"])){
	switch($_REQUEST["action"]){
		case "addhero"://///////////////////////////////////////////////////////////////////////////////////////////////
			$stmt = $db->prepare("insert into hero (name,hp,atk,spd,def,res,hpgrowth,atkgrowth,spdgrowth,defgrowth,resgrowth,weapontype,movetype,color) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
			$stmt->bindParam(1,$_REQUEST["heroadd_name"]);
			$stmt->bindParam(2,$_REQUEST["heroadd_hp"]);
			$stmt->bindParam(3,$_REQUEST["heroadd_atk"]);
			$stmt->bindParam(4,$_REQUEST["heroadd_spd"]);
			$stmt->bindParam(5,$_REQUEST["heroadd_def"]);
			$stmt->bindParam(6,$_REQUEST["heroadd_res"]);
			$stmt->bindParam(7,$_REQUEST["heroadd_hpgrowth"]);
			$stmt->bindParam(8,$_REQUEST["heroadd_atkgrowth"]);
			$stmt->bindParam(9,$_REQUEST["heroadd_spdgrowth"]);
			$stmt->bindParam(10,$_REQUEST["heroadd_defgrowth"]);
			$stmt->bindParam(11,$_REQUEST["heroadd_resgrowth"]);
			$stmt->bindParam(12,$_REQUEST["heroadd_weapon"]);
			$stmt->bindParam(13,$_REQUEST["heroadd_move"]);
			$stmt->bindParam(14,$_REQUEST["heroadd_color"]);
			$stmt->execute();
		break;
		case "addskills"://///////////////////////////////////////////////////////////////////////////////////////////////
			if($_REQUEST["skilladd_hero"]>-1){
				//get the hero
				$heroid = $_REQUEST["skilladd_hero"];

				//add the skills
				$skillnames = array("skilladd_weapon","skilladd_assist","skilladd_special","skilladd_a","skilladd_b","skilladd_c");
				foreach($skillnames as $skillname){
					if($_REQUEST[$skillname]>-1){
						addSkill($heroid,$_REQUEST[$skillname]);
					}
				}
			}
			else{
				echo "No hero selected.";
			}
		break;
		case "addskill"://///////////////////////////////////////////////////////////////////////////////////////////////
			$stmt = $db->prepare("insert into skill (name,slot,sp,description,hp,atk,spd,def,res,charge,inheritrule) values (?,?,?,?,?,?,?,?,?,?,?)");
			$stmt->bindParam(1,$_REQUEST["skill_name"]);
			$stmt->bindParam(2,$_REQUEST["skill_slot"]);
			$stmt->bindParam(3,$_REQUEST["skill_sp"]);
			$stmt->bindParam(4,$_REQUEST["skill_description"]);
			$stmt->bindParam(5,$_REQUEST["skill_hp"]);
			$stmt->bindParam(6,$_REQUEST["skill_atk"]);
			$stmt->bindParam(7,$_REQUEST["skill_spd"]);
			$stmt->bindParam(8,$_REQUEST["skill_def"]);
			$stmt->bindParam(9,$_REQUEST["skill_res"]);
			$stmt->bindParam(10,$_REQUEST["skill_charge"]);
			$stmt->bindParam(11,$_REQUEST["skill_inheritrule"]);
			$stmt->execute();
		break;
		case "addprereq"://///////////////////////////////////////////////////////////////////////////////////////////////
			$stmt = $db->prepare("insert into skill_prereq (skill_id,required_id) values (?,?)");
			$stmt->bindParam(1,$_REQUEST["prereq_skill"]);
			$stmt->bindParam(2,$_REQUEST["prereq_prereq"]);
			$stmt->execute();
		break;
	}
}

function addSkill($heroid,$skillid){
	require("dbHeroes.php");
	$stmt2 = $db->prepare("insert into hero_skill (hero_id,skill_id) values (?,?)");
	$stmt2->bindParam(1,$heroid);
	$stmt2->bindParam(2,$skillid);
	$stmt2->execute();

	//recursive for prereqs
	$stmt2 = $db->prepare("select required_id from skill_prereq where skill_id = ?");
	$stmt2->bindParam(1,$skillid);
	$stmt2->execute();
	$rows = $stmt2->rowCount();
	if($rows>0){
		if($rows>1){
			echo "Multiple prereqs found for skill " . $skillid;
		}
		else{
			$result2 = $stmt2->fetch();
			addSkill($heroid,$result2["required_id"]);
		}
	}
}
?>