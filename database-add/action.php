<?php require("dbHeroes.php");

if (isset($_REQUEST["action"])){
	switch($_REQUEST["action"]){
		case "addhero"://///////////////////////////////////////////////////////////////////////////////////////////////
			$stmt = $db->prepare("insert into hero (name,basehp,baseatk,basespd,basedef,baseres,hpgrowth,atkgrowth,spdgrowth,defgrowth,resgrowth,weapontype,movetype,color,minrarity) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
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
			$stmt->bindParam(15,$_REQUEST["heroadd_minrarity"]);
			$stmt->execute();
			echo "Hero: " . $_REQUEST["heroadd_name"] . " added.";
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
			$stmt = $db->prepare("insert into skill (name,slot,sp,description,hp,atk,spd,def,res,charge,inheritrule,affectsduel) values (?,?,?,?,?,?,?,?,?,?,?,?)");
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
			$stmt->bindParam(12,$_REQUEST["skill_affectsduel"]);
			$stmt->execute();
			echo "Skill: " . $_REQUEST["skill_name"] . " added.";
		break;
		case "addprereq"://///////////////////////////////////////////////////////////////////////////////////////////////
			$stmt = $db->prepare("insert into skill_prereq (skill_id,required_id) values (?,?)");
			$stmt->bindParam(1,$_REQUEST["prereq_skill"]);
			$stmt->bindParam(2,$_REQUEST["prereq_prereq"]);
			$stmt->execute();
			echo $_REQUEST["prereq_prereq"] . " now prereq for " . $_REQUEST["prereq_skill"];
		break;
	}
}

function addSkill($heroid,$skillid){
	require("dbHeroes.php");

	//get skill stats to determine rarity it is gotten at
	$stmt = $db->prepare("select sp,slot,inheritrule,name from skill where skill_id=?");
	$stmt->bindParam(1,$skillid);
	$stmt->execute();
	$skillResult = $stmt->fetch();//If this statement doesn't work there's a serious problem

	$rarityAcquire = 0;
	if($skillResult["slot"]=="weapon"){
		//Healer weapons are 50/150, rest are 0/100/200/300(400 legendary)
		if($skillResult["sp"]<100){
			$rarityAcquire = 1;
		}
		else if($skillResult["sp"]<150){
			$rarityAcquire = 2;
		}
		else if($skillResult["sp"]<300){
			$rarityAcquire = 3;
		}
		else{
			$rarityAcquire = 5;
		}
	}
	else if($skillResult["slot"]=="assist"){
		if($skillResult["inheritrule"]=="staff"){
			//Heals go 1/2/4
			if($skillResult["sp"]<100){
				$rarityAcquire = 1;
			}
			else if($skillResult["sp"]<200){
				$rarityAcquire = 2;
			}
			else if($skillResult["sp"]<300){
				$rarityAcquire = 4;
			}
		}
		else{
			$rarityAcquire = 3;
		}
	}
	else if($skillResult["slot"]=="special"){//Healer skills are 50/15 and 2/3, 
		if($skillResult["sp"]<150){
			$rarityAcquire = 2;
		}
		else if($skillResult["sp"]==150){	
			if($skillResult["inheritrule"]=="staff"){
				$rarityAcquire = 3;
			}
			else{
				//Not actually sure of Rising skills unlocked at 2 or 3
				$rarityAcquire = 2;
			}
		}
		else if($skillResult["sp"]<500){	
				$rarityAcquire = 4;
		}
		else{	
				$rarityAcquire = 5;
		}
	}
	else if($skillResult["slot"]=="a"||$skillResult["slot"]=="b"||$skillResult["slot"]=="c"){
		//Specialty (1) is 1-2-4; non-specialty (0) is 3-4-5
		//Non-tiered skills are 3
		//All tiered skills so far have numbers except type-specific buffs
		//Tiered skills - next tier is double previous
		//Bases are 30,40,50,60, so 30 and 60 have overlap - necessitates cheapSkill variable
		$isTiered = preg_match("/(\\d|Hone|Goad|Fortify|Ward)/",$skillResult["name"]);
		if(!$isTiered){
			$rarityAcquire = 3;
		}
		else{
			$specialty = $_REQUEST[$skillResult["slot"] . "_specialty"];
			$isCheapSkill = preg_match("/(HP|Attack|Speed|Defense|Resistance) [0-9]/",$skillResult["name"]);
			if($isCheapSkill==1){
				//Make it not cheap!
				$skillResult["sp"] *= 2;
			}
			if($specialty==1){
				if($skillResult["sp"]<80){
					$rarityAcquire = 1;
				}
				else if($skillResult["sp"]<160){
					$rarityAcquire = 2;
				}
				else{
					$rarityAcquire = 4;
				}
			}
			else{
				if($skillResult["sp"]<80){
					$rarityAcquire = 3;
				}
				else if($skillResult["sp"]<160){
					$rarityAcquire = 4;
				}
				else{
					$rarityAcquire = 5;
				}
			}
		}	
	}

	$stmt2 = $db->prepare("insert into hero_skill (hero_id,skill_id,rarity) values (?,?,?)");
	$stmt2->bindParam(1,$heroid);
	$stmt2->bindParam(2,$skillid);
	$stmt2->bindParam(3,$rarityAcquire);
	$stmt2->execute();
	echo "Skill " . $skillResult["name"] . " added for heroid " . $heroid . " with rarity " . $rarityAcquire . ".<br/>";

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