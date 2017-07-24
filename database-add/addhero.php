<!-- The following is my database adding page when the calculator was hosted on andyiverson.me. Perhaps something similar can be created for the JSON-based data? -->
<!-- see also action.php -->

<?php require("dbHeroes.php");

//Get heroes
$stmt = $db->prepare("select name,hero_id from hero order by name");
$stmt->execute();

$heroHTML = "<option value=-1 >None</option>";
while($result = $stmt->fetch()){
	$heroHTML .= "<option value=" . $result["hero_id"] . ">" . $result["name"] . "</option>";
}

//Get max level weapons, plus Ruin, Elfire
$stmt = $db->prepare("select skill.skill_id,skill.name from skill left join skill_prereq on skill.skill_id=required_id where required_id is NULL and slot=\"weapon\" order by skill.name");
$stmt->execute();

$weaponHTML = "<option value=-1 >None</option>";
while($result = $stmt->fetch()){
	$weaponHTML .= "<option value=" . $result["skill_id"] . ">" . $result["name"] . "</option>";
}

$weaponHTML .= "<option value=30>Ruin</option>";
$weaponHTML .= "<option value=26>Elfire</option>";

//Get max level assists
$stmt = $db->prepare("select skill.skill_id,skill.name from skill left join skill_prereq on skill.skill_id=required_id where required_id is NULL and slot=\"assist\" order by skill.name");
$stmt->execute();

$assistHTML = "<option value=-1 >None</option>";
while($result = $stmt->fetch()){
	$assistHTML .= "<option value=" . $result["skill_id"] . ">" . $result["name"] . "</option>";
}

$assistHTML .= "<option value=132>Rally Attack</option>";
$assistHTML .= "<option value=133>Rally Speed</option>";
$assistHTML .= "<option value=134>Rally Defense</option>";
$assistHTML .= "<option value=135>Rally Resistance</option>";

//Get max level specials, plus Astra, Sol, and Luna
$stmt = $db->prepare("select skill.skill_id,skill.name from skill left join skill_prereq on skill.skill_id=required_id where required_id is NULL and slot=\"special\" order by skill.name");
$stmt->execute();

$specialHTML = "<option value=-1 >None</option>";
while($result = $stmt->fetch()){
	$specialHTML .= "<option value=" . $result["skill_id"] . ">" . $result["name"] . "</option>";
}

$specialHTML .= "<option value=162>Astra</option>";
$specialHTML .= "<option value=168>Sol</option>";
$specialHTML .= "<option value=170>Luna</option>";

//Get max level as
$stmt = $db->prepare("select skill.skill_id,skill.name from skill left join skill_prereq on skill.skill_id=required_id where required_id is NULL and slot=\"a\" order by skill.name");
$stmt->execute();

$aHTML = "<option value=-1 >None</option>";
while($result = $stmt->fetch()){
	$aHTML .= "<option value=" . $result["skill_id"] . ">" . $result["name"] . "</option>";
}

$aHTML .= "<option value=205>Attack 1</option>";
$aHTML .= "<option value=208>Speed 1</option>";
$aHTML .= "<option value=211>Defense 1</option>";
$aHTML .= "<option value=214>Resistance 1</option>";
$aHTML .= "<option value=223>Armored Blow 1</option>";
$aHTML .= "<option value=226>Darting Blow 1</option>";
$aHTML .= "<option value=229>Death Blow 1</option>";
$aHTML .= "<option value=232>Warding Blow 1</option>";

//Get max level bs
$stmt = $db->prepare("select skill.skill_id,skill.name from skill left join skill_prereq on skill.skill_id=required_id where required_id is NULL and slot=\"b\" order by skill.name");
$stmt->execute();

$bHTML = "<option value=-1 >None</option>";
while($result = $stmt->fetch()){
	$bHTML .= "<option value=" . $result["skill_id"] . ">" . $result["name"] . "</option>";
}

$bHTML .= "<option value=253>Seal Atk 1</option>";
$bHTML .= "<option value=256>Seal Spd 1</option>";
$bHTML .= "<option value=259>Seal Def 1</option>";
$bHTML .= "<option value=262>Seal Res 1</option>";

//Get max level cs, plus spur/hones 2
$stmt = $db->prepare("select skill.skill_id,skill.name from skill left join skill_prereq on skill.skill_id=required_id where required_id is NULL and slot=\"c\" order by skill.name");
$stmt->execute();

$cHTML = "<option value=-1 >None</option>";
while($result = $stmt->fetch()){
	$cHTML .= "<option value=" . $result["skill_id"] . ">" . $result["name"] . "</option>";
}

$cHTML .= "<option value=329>Hone Atk 2</option>";
$cHTML .= "<option value=332>Hone Spd 2</option>";
$cHTML .= "<option value=335>Fortify Def 2</option>";
$cHTML .= "<option value=338>Fortify Res 2</option>";
$cHTML .= "<option value=341>Spur Atk 2</option>";
$cHTML .= "<option value=344>Spur Spd 2</option>";
$cHTML .= "<option value=347>Spur Def 2</option>";
$cHTML .= "<option value=350>Spur Res 2</option>";
$cHTML .= "<option value=340>Spur Atk 1</option>";
$cHTML .= "<option value=343>Spur Spd 1</option>";
$cHTML .= "<option value=346>Spur Def 1</option>";
$cHTML .= "<option value=349>Spur Res 1</option>";

//Just get all skills
$stmt = $db->prepare("select skill_id,name,slot from skill order by slot,name");
$stmt->execute();

$skillHTML = "<option value=-1 >None</option>";
while($result = $stmt->fetch()){
	$skillHTML .= "<option value=" . $result["skill_id"] . ">" . $result["slot"] . "-" . $result["name"] . "</option>";
}

?>

<!doctype html>
<html>

<head>
	<title>Andy's FEH database editor</title>
	<script type="text/javascript" src="/libraries/jquery.js"></script>
	<script>
		function submitShit(actionName){
			var data = {action: actionName};
			$("input, select, textarea").each(function(){
				data[$(this).attr("name")] = $(this).val();
			})
			debugger;
			$.ajax({
				url: "action.php",
				data: data
			}).done(function(echo){
				$("#messages").append(echo + "<br/>");
			});
		}
	</script>
</head>

<body>

	This is my personal hero adding page. You shouldn't be here, you sneaky sneak!<br>

	<div style="display:inline-block;margin:15px;">
		<h1>Add new Hero</h1>
		<form id="newhero" action="action.php?action=addhero" method="post">
			Name: <input type="textbox" name="heroadd_name"/><br>
			Base HP: <input type="textbox" name="heroadd_hp"/><br>
			Base Atk: <input type="textbox" name="heroadd_atk"/><br>
			Base Spd: <input type="textbox" name="heroadd_spd"/><br>
			Base Def: <input type="textbox" name="heroadd_def"/><br>
			Base Res: <input type="textbox" name="heroadd_res"/><br>
			HP Growth: <input type="textbox" name="heroadd_hpgrowth"/><br>
			Atk Growth: <input type="textbox" name="heroadd_atkgrowth"/><br>
			Spd Growth: <input type="textbox" name="heroadd_spdgrowth"/><br>
			Def Growth: <input type="textbox" name="heroadd_defgrowth"/><br>
			Res Growth: <input type="textbox" name="heroadd_resgrowth"/><br>
			Min rarity: <input type="textbox" name="heroadd_minrarity"/><br>
			Weapon type: <select name="heroadd_weapon">
				<option>sword</option>
				<option>lance</option>
				<option>axe</option>
				<option>redtome</option>
				<option>bluetome</option>
				<option>greentome</option>
				<option>dragon</option>
				<option>bow</option>
				<option>dagger</option>
				<option>staff</option>
			</select><br>
			Color: <select name="heroadd_color">
				<option>red</option>
				<option>blue</option>
				<option>green</option>
				<option>gray</option>
			</select><br>
			Move type: <select name="heroadd_move">
				<option>infantry</option>
				<option>cavalry</option>
				<option>flying</option>
				<option>armored</option>
			</select><br>
			<div style="background-color:#cccccc;text-align:center;cursor:pointer;" onclick="submitShit('addhero');">Add</div>
		</form>
	</div>

	<div style="display:inline-block;margin:15px;">
		<h1>Add Skills to Hero</h1>

		All prerequisite skills will be added, just final skills are shown

		<form id="heroskills" action="action.php?action=addskills" method="post">
			Hero: <select name="skilladd_hero">
				<?php echo $heroHTML?>
			</select><br>
			Weapon: <select name="skilladd_weapon">
				<?php echo $weaponHTML?>
			</select><br>
			Assist: <select name="skilladd_assist">
				<?php echo $assistHTML?>
			</select><br>
			Special: <select name="skilladd_special">
				<?php echo $specialHTML?>
			</select><br>
			A: <select name="skilladd_a">
				<?php echo $aHTML?>
			</select><select name="a_specialty">
				<option value=0>Not specialty</option>
				<option value=1>Specialty</option>
			</select><br>
			B: <select name="skilladd_b">
				<?php echo $bHTML?>
			</select><select name="b_specialty">
				<option value=0>Not specialty</option>
				<option value=1>Specialty</option>
			</select><br>
			C: <select name="skilladd_c">
				<?php echo $cHTML?>
			</select><select name="c_specialty">
				<option value=0>Not specialty</option>
				<option value=1>Specialty</option>
			</select><br>
			<div style="background-color:#cccccc;text-align:center;cursor:pointer;" onclick="submitShit('addskills');">Add</div>
		</form>
	</div>

	<div style="display:inline-block;margin:15px;">
		<h1>Add skill</h1>
		<form id="skill" action="action.php?action=addskill" method="post">
			Name: <input type="textbox" name="skill_name"/><br>
			Slot: <input type="textbox" name="skill_slot"/><br>
			SP: <input type="textbox" name="skill_sp"/><br>
			Description: <textarea name="skill_description"></textarea><br>
			HP: <input type="textbox" name="skill_hp"/><br>
			Atk: <input type="textbox" name="skill_atk"/><br>
			Spd: <input type="textbox" name="skill_spd"/><br>
			Def: <input type="textbox" name="skill_def"/><br>
			Res: <input type="textbox" name="skill_res"/><br>
			Charge: <input type="textbox" name="skill_charge"/><br>
			Inheritrule: <input type="textbox" name="skill_inheritrule"/><br>
			AffectsDuel: <select name="skill_affectsduel">
				<option value=0>No</option>
				<option value=1 selected="selected">Yes</option>
			</select><br>
			<div style="background-color:#cccccc;text-align:center;cursor:pointer;" onclick="submitShit('addskill');">Add</div>
		</form>
	</div>

	<div style="display:inline-block;margin:15px;">
		<h1>Add Prereq</h1>
		<form id="prereq" action="action.php?action=addprereq" method="post">
			Skill: <select name="prereq_skill">
				<?php echo $skillHTML?>
			</select><br>
			Prereq: <select name="prereq_prereq">
				<?php echo $skillHTML?>
			</select><br>
			<div style="background-color:#cccccc;text-align:center;cursor:pointer;" onclick="submitShit('addprereq');">Add</div>
		</form>
	</div>

	<div id="messages">

	</div>
</body>

</html>