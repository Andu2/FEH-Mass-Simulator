var debug = false;
var autoCalculate = true;

var challengerIndex = -1;
var weapons = ["sword","lance","axe","redtome","bluetome","greentome","dragon","bow","dagger","staff"];
var rangedWeapons = ["redtome","bluetome","greentome","bow","dagger","staff"];
var meleeWeapons = ["sword","lance","axe","dragon"];
var physicalWeapons = ["sword","lance","axe","bow","dagger"];
var magicalWeapons = ["redtome","bluetome","greentome","dragon","staff"];
var movetypes = ["infantry","armored","flying","cavalry"];
var colors = ["red","blue","green","gray"];
var include = {"melee":1,"ranged":1,"red":1,"blue":1,"green":1,"gray":1,"physical":1,"magical":1,"infantry":1,"cavalry":1,"flying":1,"armored":1,"staff":0,"nonstaff":1};

var validWeaponSkills;
var validSpecialSkills;
var validASkills;
var validBSkills;
var validCSkills;

var challengerWeapon = -1;
var challengerSpecial = -1;
var challengerA = -1;
var challengerB = -1;
var challengerC = -1;
var challengerBaseSkills = [];

var challengerHp = 0;
var challengerAtk = 0;
var challengerSpd = 0;
var challengerDef = 0;
var challengerRes = 0;

//enemyData will have info for specific enemyindex skills and stats
var enemyData = [];

var challengerMerge = 0;
var enemiesMerge = 0;

var challengerDamage = 0;
var enemyDamage = 0;

var challengerPrecharge = 0;
var enemyPrecharge = 0;

var enemiesWeapon = -1;
var enemiesSpecial = -1;
var enemiesA = -1;
var enemiesB = -1;
var enemiesC = -1;

var enemiesReplaceWeapon = false;
var enemiesReplaceSpecial = false;
var enemiesReplaceA = false;
var enemiesReplaceB = false;
var enemiesReplaceC = false;

var heroPossibleSkills = [];
var heroBaseSkills = [];
var heroMaxSkills = [];

var challengerBuffs = {"atk":0,"spd":0,"def":0,"res":0};
var enemyBuffs = {"atk":0,"spd":0,"def":0,"res":0};
var challengerSpur = {"atk":0,"spd":0,"def":0,"res":0};
var enemySpur = {"atk":0,"spd":0,"def":0,"res":0};

var startTurn = 0;
var useGaleforce = true;
var startThreatened = false;
var showOnlyMaxSkills = true;

var fightResults = []; //Needs to be global variable to get info for tooltip
var resultHTML = []; //Needs to be a global variable to flip sort order without recalculating
var previousFightResults = new Array(heroes.length); //For comparing between calculations; actually an array of html strings with index corresponding to heroes[] index
//.fill() doesn't work in older versions of IE
//previousFightResults.fill("");
for(var i = 0; i < previousFightResults.length;i++){
	previousFightResults[i] = "";
}

var showingTooltip = false;
var calcuwaiting = false;
var calcuwaitTime = 0;

var enemyAvgHp = 0;
var enemyAvgAtk = 0;
var enemyAvgSpd = 0;
var enemyAvgDef = 0;
var enemyAvgRes = 0;

var roundInitiators = ["Challenger initiates","Enemy initiates"];

//Growth shifts of 3 are what make some banes/boons +/- 4
var growths = [8,10,13,15,17,19,22,24,26,28,30,33];

var skillsThatArePrereq = [];
//Prereq exceptions are Sol, Luna, Astra, Assault
var skillPrereqExceptions = [125,162,168,170];

//Remember: heroes, skills, prereqs, and heroskills arrays come from PHP-created script

//Sort hero array by name
heroes.sort(function(a,b){
	//console.log(a.name + ", " + b.name + ": " + a.name>b.name);
	return (a.name>b.name)*2-1;
})

//Sort skills array by name
skills.sort(function(a,b){
	//console.log(a.name + ", " + b.name + ": " + a.name>b.name);
	return (a.name>b.name)*2-1;
})

var allWeaponSkills = getValidSkills("weapon");
var allSpecialSkills = getValidSkills("special");
var allASkills = getValidSkills("a");
var allBSkills = getValidSkills("b");
var allCSkills = getValidSkills("c");

//Make list of all skill ids that are a strictly inferior prereq to exclude from dropdown boxes
for(var i = 0; i < prereqs.length;i++){
	if(skillsThatArePrereq.indexOf(prereqs[i].required_id)==-1 && skillPrereqExceptions.indexOf(prereqs[i].required_id)==-1){
		skillsThatArePrereq.push(prereqs[i].required_id);
	}
}

//Find hero skills
for(var i = 0; i < heroes.length;i++){
	heroPossibleSkills.push(getValidSkills(false,i));
	heroBaseSkills.push(findHeroSkills(i));
	heroMaxSkills.push(findMaxSkills(i));
}

$(document).ready(function(){
	//Populate hero select options
	heroHTML = "<option value=-1 class=\"hero_option\">Select Hero</option>";
	for(var i = 0; i < heroes.length; i++){
		heroHTML += "<option value=" + i + " class=\"hero_option\">" + heroes[i].name + "</option>";
	}
	$("#hero_name").html(heroHTML);

	setEnemySkillOptions();

	setEnemies();
	setEnemySkills();
	setEnemyStats();
	setUI();

	$("#hero_name").change(function(){
		challengerIndex = $(this).val();

		if(challengerIndex != -1){

			//find hero's starting skills
			challengerBaseSkills = heroBaseSkills[challengerIndex];

			validWeaponSkills = getValidSkills("weapon",challengerIndex);
			validSpecialSkills = getValidSkills("special",challengerIndex);
			validASkills = getValidSkills("a",challengerIndex);
			validBSkills = getValidSkills("b",challengerIndex);
			validCSkills = getValidSkills("c",challengerIndex);
			setSkillOptions();

			challengerWeapon = heroMaxSkills[challengerIndex].weapon;
			challengerSpecial = heroMaxSkills[challengerIndex].special;
			challengerA = heroMaxSkills[challengerIndex].a;
			challengerB = heroMaxSkills[challengerIndex].b;
			challengerC = heroMaxSkills[challengerIndex].c;

			$("#hero_weapon").val(challengerWeapon);
			$("#hero_special").val(challengerSpecial);
			$("#hero_a").val(challengerA);
			$("#hero_b").val(challengerB);
			$("#hero_c").val(challengerC);
			//Need to set skill pictures; would just do this by triggering change function, but val() may not be done when we do that
			changeSkillPic("a",challengerA);
			changeSkillPic("b",challengerB);
			changeSkillPic("c",challengerC);

			//Analytics
			dataLayer.push({"event":"changeHero","hero_name":heroes[challengerIndex].name});
		}

		setStats();
		setUI();

		if(autoCalculate){
			calculate();
		}
	});

	$("#challenger_merge").change(function(){
		var newVal = parseInt($(this).val());
		if(newVal < 0){
			$(this).val(0);
			newVal = 0;
		}
		else if(newVal > 10){
			$(this).val(10);
			newVal = 10;
		}
		challengerMerge = newVal;
		setStats();
		setUI();
		if(autoCalculate){
			calcuWait(300);
		}
	});
	$("#enemies_merge").change(function(){
		var newVal = parseInt($(this).val());
		if(newVal < 0){
			$(this).val(0);
			newVal = 0;
		}
		else if(newVal > 10){
			$(this).val(10);
			newVal = 10;
		}
		enemiesMerge = newVal;
		setEnemyStats();
		setUI();
		if(autoCalculate){
			calcuWait(300);
		}
	});

	$("#challenger_damage").change(function(){
		var newVal = parseInt($(this).val());
		if(newVal < 0){
			$(this).val(0);
			newVal = 0;
		}
		else if(newVal > 99){
			$(this).val(99);
			newVal = 99;
		}
		challengerDamage = newVal;
		if(autoCalculate){
			calcuWait(300);
		}
	});
	$("#enemies_damage").change(function(){
		var newVal = parseInt($(this).val());
		if(newVal < 0){
			$(this).val(0);
			newVal = 0;
		}
		else if(newVal > 99){
			$(this).val(99);
			newVal = 99;
		}
		enemyDamage = newVal;
		if(autoCalculate){
			calcuWait(300);
		}
	});

	$("#challenger_precharge").change(function(){
		var newVal = parseInt($(this).val());
		if(newVal < 0){
			$(this).val(0);
			newVal = 0;
		}
		else if(newVal > 6){
			$(this).val(6);
			newVal = 6;
		}
		challengerPrecharge = newVal;
		setUI();
		if(autoCalculate){
			calcuWait(300);
		}
	});
	$("#enemies_precharge").change(function(){
		var newVal = parseInt($(this).val());
		if(newVal < 0){
			$(this).val(0);
			newVal = 0;
		}
		else if(newVal > 6){
			$(this).val(6);
			newVal = 6;
		}
		setUI();
		enemyPrecharge = newVal;
		if(autoCalculate){
			calcuWait(300);
		}
	});

	$(".wideincludebutton, .thinincludebutton").click(function(){
		var includeRule = this.id.substring(8);
		if(include[includeRule]){
			include[includeRule] = 0;
			$(this).removeClass("included");
			$(this).addClass("notincluded");
		}
		else{
			include[includeRule] = 1;
			$(this).removeClass("notincluded");
			$(this).addClass("included");
		}
		setEnemies();
		setEnemySkills();
		setEnemyStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});

	$(".buff_input").change(function(){
		var newVal = parseInt($(this).val());
		if(newVal < 0){
			$(this).val(0);
			newVal = 0;
		}
		else if(newVal > 7){
			$(this).val(7);
			newVal = 7;
		}
		var buffStat = this.id.substring(this.id.length-8,this.id.length-5);
		if(this.id.substring(0,4)=="hero"){
			challengerBuffs[buffStat] = newVal;
		}
		else if(this.id.substring(0,7)=="enemies"){
			enemyBuffs[buffStat] = newVal;
		}

		setUI();

		if(autoCalculate){
			calcuWait(300);
		}
	});

	$(".spur_input").change(function(){
		var newVal = parseInt($(this).val());
		if(newVal < 0){
			$(this).val(0);
			newVal = 0;
		}
		else if(newVal > 12){
			$(this).val(12);
			newVal = 12;
		}
		var spurStat = this.id.substring(this.id.length-8,this.id.length-5);
		if(this.id.substring(0,4)=="hero"){
			challengerSpur[spurStat] = newVal;
		}
		else if(this.id.substring(0,7)=="enemies"){
			enemySpur[spurStat] = newVal;
		}

		setUI();

		if(autoCalculate){
			calcuWait(300);
		}
	});

	$("#hero_weapon").change(function(){
		challengerWeapon = parseInt($(this).val());
		if(challengerWeapon != -1){
			dataLayer.push({"event":"changeSkill","skill_name":skills[challengerWeapon].name});
		}
		setStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});
	$("#hero_special").change(function(){
		challengerSpecial = parseInt($(this).val());
		if(challengerSpecial != -1){
			dataLayer.push({"event":"changeSkill","skill_name":skills[challengerSpecial].name});
		}
		setStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});
	$("#hero_a").change(function(){
		challengerA = parseInt($(this).val());
		if(challengerA != -1){
			dataLayer.push({"event":"changeSkill","skill_name":skills[challengerA].name});
		}
		changeSkillPic("a",challengerA);
		setStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});
	$("#hero_b").change(function(){
		challengerB = parseInt($(this).val());
		if(challengerB != -1){
			dataLayer.push({"event":"changeSkill","skill_name":skills[challengerB].name});
		}
		changeSkillPic("b",challengerB);
		setStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});
	$("#hero_c").change(function(){
		challengerC = parseInt($(this).val());
		if(challengerC != -1){
			dataLayer.push({"event":"changeSkill","skill_name":skills[challengerC].name});
		}
		changeSkillPic("c",challengerC);
		setStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});

	$("#enemies_weapon").change(function(){
		enemiesWeapon = parseInt($(this).val());
		setEnemySkills();
		setEnemyStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});
	$("#enemies_special").change(function(){
		enemiesSpecial = parseInt($(this).val());
		setEnemySkills();
		setEnemyStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});
	$("#enemies_a").change(function(){
		enemiesA = parseInt($(this).val());
		changeEnemiesSkillPic("a",enemiesA);
		setEnemySkills();
		setEnemyStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});
	$("#enemies_b").change(function(){
		enemiesB = parseInt($(this).val());
		changeEnemiesSkillPic("b",enemiesB);
		setEnemySkills();
		setEnemyStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});
	$("#enemies_c").change(function(){
		enemiesC = parseInt($(this).val());
		changeEnemiesSkillPic("c",enemiesC);
		setEnemySkills();
		setEnemyStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});

	$("#enemies_weapon_overwrite").change(function(){
		enemiesReplaceWeapon = parseInt($(this).val());
		setEnemySkills();
		setEnemyStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});
	$("#enemies_special_overwrite").change(function(){
		enemiesReplaceSpecial = parseInt($(this).val());
		setEnemySkills();
		setEnemyStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});
	$("#enemies_a_overwrite").change(function(){
		enemiesReplaceA = parseInt($(this).val());
		setEnemySkills();
		setEnemyStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});
	$("#enemies_b_overwrite").change(function(){
		enemiesReplaceB = parseInt($(this).val());
		setEnemySkills();
		setEnemyStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});
	$("#enemies_c_overwrite").change(function(){
		enemiesReplaceC = parseInt($(this).val());
		setEnemySkills();
		setEnemyStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});

	$("#add_turn_challenger").click(function(){
		addTurn("Challenger initiates");
	})
	$("#add_turn_enemy").click(function(){
		addTurn("Enemy initiates");
	})

	$("#rules_prereqs").change(function(){
		if($(this).is(":checked")){
			showOnlyMaxSkills = false;
			if(challengerIndex != -1){
				setSkillOptions();
				resetChallengerSkills();
			}	
		}
		else{
			showOnlyMaxSkills = true;
			if(challengerIndex != -1){
				setSkillOptions();
				resetChallengerSkills();
			}
		}

		setEnemySkillOptions();
		setEnemySkills();
		setEnemyStats();
		setUI();

		if(autoCalculate){
			calculate();
		}
	});

	$("#rules_galeforce").change(function(){
		if($(this).is(":checked")){
			useGaleforce = true;
		}
		else{
			useGaleforce = false;
		}
		if(autoCalculate){
			calculate();
		}
	});

	$("#rules_threaten").change(function(){
		if($(this).is(":checked")){
			startThreatened = true;
		}
		else{
			startThreatened = false;
		}
		if(autoCalculate){
			calculate();
		}
	});

	$("#rules_renewal").change(function(){
		var newVal = parseInt($(this).val());
		if(newVal < 0){
			$(this).val(0);
			newVal = 0;
		}
		else if(newVal > 3){
			$(this).val(3);
			newVal = 3;
		}
		startTurn = newVal;
		if(autoCalculate){
			calcuWait(300);
		}
	});

	$("#autocalculate").change(function(){
		if($(this).is(":checked")){
			autoCalculate = true;
			calculate();
		}
		else{
			autoCalculate = false;
		}
	});

	$("#sort_results").change(function(){
		outputResults();
	});


	$(".boonbutton").click(function(){
		if($(this).attr("data-val")==0){
			$(this).attr("data-val",1).html("Boon").removeClass("neutral").addClass("boon");
		}
		else if($(this).attr("data-val")==1){
			$(this).attr("data-val",-1).html("Bane").removeClass("boon").addClass("bane");
		}
		else if($(this).attr("data-val")==-1){
			$(this).attr("data-val",0).html("Neutral").removeClass("bane").addClass("neutral");
		}
		setStats();
		setEnemyStats();
		setUI();
		if(autoCalculate){
			calcuWait(300);
		}
	});

	$(document).mousemove(function(e){
		if(showingTooltip){
			var tooltipHeight =    $("#frame_tooltip").height();
			if(e.pageY + (tooltipHeight/2) + 10 > $("body").height()){
				$("#frame_tooltip").css({
					"left": e.pageX + 20 + "px",
					"top": e.pageY - tooltipHeight - 10 + "px"
				});
			}
			else{
				$("#frame_tooltip").css({
					"left": e.pageX + 20 + "px",
					"top": e.pageY - (tooltipHeight/2) + "px"
				});
			}	
		}	
	});

});

function changeSkillPic(slot,skillindex){
	if(skillindex < 0){
		$("#hero_" + slot + "_picture").attr("src","skills/noskill.png");
	}
	else{
		var skillname = skills[skillindex].name;
		skillname = skillname.replace(/\s/g,"_");
		$("#hero_" + slot + "_picture").attr("src","skills/" + skillname + ".png");
	}
}

function changeEnemiesSkillPic(slot,skillindex){
	if(skillindex < 0){
		$("#enemies_" + slot + "_picture").attr("src","skills/noskill.png");
	}
	else{
		var skillname = skills[skillindex].name;
		skillname = skillname.replace(/\s/g,"_");
		$("#enemies_" + slot + "_picture").attr("src","skills/" + skillname + ".png");
	}
}

function getValidSkills(slot,heroindex){
	//returns an array of indices on "skills" array for skills that heroindex can learn
	//If not given heroindex, returns all skills in slot except unique
	//if not given slot, gives all
	var validSkills = [];
	for(var i = 0; i < skills.length; i++){
		if(!slot || skills[i].slot == slot){
			if(heroindex){
				//console.log("Trying " + slot + ": " + skills[i].name);
				if(skills[i].inheritrule == "unique"){
					//can only use if hero starts with it
					if(challengerBaseSkills.indexOf(skills[i].skill_id)!=-1){
						validSkills.push(i);
					}
				}
				else if(weapons.indexOf(skills[i].inheritrule)!=-1){
					//inherit if weapon is right
					if(heroes[heroindex].weapontype==skills[i].inheritrule){
						validSkills.push(i);
					}
				}
				else if(movetypes.indexOf(skills[i].inheritrule)!=-1){
					//inherit if movetype is right
					if(heroes[heroindex].movetype==skills[i].inheritrule){
						validSkills.push(i);
					}
				}
				else if(weapons.indexOf(skills[i].inheritrule.replace("non",""))!=-1){
					//inherit if not a certain weapon
					if(heroes[heroindex].weapontype!=skills[i].inheritrule.replace("non","")){
						validSkills.push(i);
					}
				}
				else if(movetypes.indexOf(skills[i].inheritrule.replace("non",""))!=-1){
					//inherit if not a certain movement type
					if(heroes[heroindex].movetype!=skills[i].inheritrule.replace("non","")){
						validSkills.push(i);
					}
				}
				else if(colors.indexOf(skills[i].inheritrule.replace("non",""))!=-1){
					//inherit if not a certain color
					if(heroes[heroindex].color!=skills[i].inheritrule.replace("non","")){
						validSkills.push(i);
					}
				}
				else if(skills[i].inheritrule=="ranged"){
					//inherit if weapon type in ranged group
					if(rangedWeapons.indexOf(heroes[heroindex].weapontype) != -1){
						validSkills.push(i);
					}
				}
				else if(skills[i].inheritrule=="melee"){
					//inherit if weapon type in melee group
					if(meleeWeapons.indexOf(heroes[heroindex].weapontype) != -1){
						validSkills.push(i);
					}
				}
				else if(skills[i].inheritrule==""){
					//everyone can inherit!
					validSkills.push(i);
				}
				else{
					//shouldn't get here
					console.log("Issue finding logic for inheritrule " + skills[i].inheritrule);
				}
			}
			else{
				//It's the right slot, not given heroindex, so it's valid unless unique
				if(skills[i].inheritrule != "unique"){
					validSkills.push(i);
				}
			}
		}
	}
	return validSkills;	
}

function findHeroSkills(heroid){
	var skillset = [];
	for(var i = 0; i < heroskills.length;i++){
		if(heroskills[i].hero_id==heroes[heroid].hero_id){
			skillset.push(heroskills[i].skill_id);
		}
	}
	return skillset;
}

function findMaxSkills(heroid){
	var maxskillset = {"weapon":-1,"special":-1,"a":-1,"b":-1,"c":-1};
	for(var i = 0; i < heroBaseSkills[heroid].length;i++){
		if(skillsThatArePrereq.indexOf(heroBaseSkills[heroid][i])==-1){
			var skillIndex = getSkillIndexFromId(heroBaseSkills[heroid][i]);
			var slot = skills[skillIndex].slot;
			if(slot != "assist"){//don't give a shit about assists for duels
				if(maxskillset[slot]!=-1){
					//If two skills have no prereqs, pick the one that costs most SP
					//If tie, pick new skill
					//console.log("Looking for " + heroes[heroid].name + " max skills: " + skills[skillIndex].name + " and " + skills[maxskillset[slot]].name + " both have no prereqs");
					if(skills[skillIndex].sp>=skills[maxskillset[slot]].sp){
						maxskillset[slot] = skillIndex;
					}
				}
				else{
					maxskillset[slot] = skillIndex;
				}
			}
		}
	}
	return maxskillset;
}

function setSkillOptions(){
	//set html for character skill select based on valid skills

	//Set weapon skill options
	weaponHTML = "<option value=-1>No weapon</option>";
	for(var i = 0; i < validWeaponSkills.length; i++){
		if(!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[validWeaponSkills[i]].skill_id)==-1){
			weaponHTML += "<option value=" + validWeaponSkills[i] + ">" + skills[validWeaponSkills[i]].name + "</option>";
		}
	}
	$("#hero_weapon").html(weaponHTML);

	//Set special skill options
	specialHTML = "<option value=-1>No special</option>";
	for(var i = 0; i < validSpecialSkills.length; i++){
		if(!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[validSpecialSkills[i]].skill_id)==-1){
			specialHTML += "<option value=" + validSpecialSkills[i] + ">" + skills[validSpecialSkills[i]].name + "</option>";
		}
	}
	$("#hero_special").html(specialHTML);

	//Set a skill options
	aHTML = "<option value=-1>No A passive</option>";
	for(var i = 0; i < validASkills.length; i++){
		if(!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[validASkills[i]].skill_id)==-1){
			aHTML += "<option value=" + validASkills[i] + ">" + skills[validASkills[i]].name + "</option>";
		}
	}
	$("#hero_a").html(aHTML);

	//Set weapon skill options
	bHTML = "<option value=-1>No B passive</option>";
	for(var i = 0; i < validBSkills.length; i++){
		if(!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[validBSkills[i]].skill_id)==-1){
			bHTML += "<option value=" + validBSkills[i] + ">" + skills[validBSkills[i]].name + "</option>";
		}
	}
	$("#hero_b").html(bHTML);

	//Set c skill options
	cHTML = "<option value=-1>No C passive</option>";
	for(var i = 0; i < validCSkills.length; i++){
		if(!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[validCSkills[i]].skill_id)==-1){
			cHTML += "<option value=" + validCSkills[i] + ">" + skills[validCSkills[i]].name + "</option>";
		}
	}
	$("#hero_c").html(cHTML);

}

function setEnemySkillOptions(){
	//set html for enemies skill select

	//Set weapon skill options
	weaponHTML = "<option value=-1>No weapon</option>";
	for(var i = 0; i < allWeaponSkills.length; i++){
		if(!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[allWeaponSkills[i]].skill_id)==-1){
			weaponHTML += "<option value=" + allWeaponSkills[i] + ">" + skills[allWeaponSkills[i]].name + "</option>";
		}
	}
	$("#enemies_weapon").html(weaponHTML);

	//Set special skill options
	specialHTML = "<option value=-1>No special</option>";
	for(var i = 0; i < allSpecialSkills.length; i++){
		if(!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[allSpecialSkills[i]].skill_id)==-1){
			specialHTML += "<option value=" + allSpecialSkills[i] + ">" + skills[allSpecialSkills[i]].name + "</option>";
		}
	}
	$("#enemies_special").html(specialHTML);

	//Set a skill options
	aHTML = "<option value=-1>No A passive</option>";
	for(var i = 0; i < allASkills.length; i++){
		if(!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[allASkills[i]].skill_id)==-1){
			aHTML += "<option value=" + allASkills[i] + ">" + skills[allASkills[i]].name + "</option>";
		}
	}
	$("#enemies_a").html(aHTML);

	//Set weapon skill options
	bHTML = "<option value=-1>No B passive</option>";
	for(var i = 0; i < allBSkills.length; i++){
		if(!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[allBSkills[i]].skill_id)==-1){
			bHTML += "<option value=" + allBSkills[i] + ">" + skills[allBSkills[i]].name + "</option>";
		}
	}
	$("#enemies_b").html(bHTML);

	//Set c skill options
	cHTML = "<option value=-1>No C passive</option>";
	for(var i = 0; i < allCSkills.length; i++){
		if(!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[allCSkills[i]].skill_id)==-1){
			cHTML += "<option value=" + allCSkills[i] + ">" + skills[allCSkills[i]].name + "</option>";
		}
	}
	$("#enemies_c").html(cHTML);
}

function setStats(){
	if(challengerIndex != -1){
		var hpBoonVal = parseInt($("#hero_boon_hp").attr("data-val"));
		var atkBoonVal = parseInt($("#hero_boon_atk").attr("data-val"));
		var spdBoonVal = parseInt($("#hero_boon_spd").attr("data-val"));
		var defBoonVal = parseInt($("#hero_boon_def").attr("data-val"));
		var resBoonVal = parseInt($("#hero_boon_res").attr("data-val"));

		var base = {};
		base.hp = heroes[challengerIndex].basehp + hpBoonVal;
		base.atk = heroes[challengerIndex].baseatk + atkBoonVal;
		base.spd = heroes[challengerIndex].basespd + spdBoonVal;
		base.def = heroes[challengerIndex].basedef + defBoonVal;
		base.res = heroes[challengerIndex].baseres + resBoonVal;

		challengerHp = base.hp + growths[heroes[challengerIndex].hpgrowth + hpBoonVal];
		challengerAtk = base.atk + growths[heroes[challengerIndex].atkgrowth + atkBoonVal];
		challengerSpd = base.spd + growths[heroes[challengerIndex].spdgrowth + spdBoonVal];
		challengerDef = base.def + growths[heroes[challengerIndex].defgrowth + defBoonVal];
		challengerRes = base.res + growths[heroes[challengerIndex].resgrowth + resBoonVal];

		//Add merge bonuses
		var mergeBoost = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};

		//Order that merges happen is highest base stats, tiebreakers go hp->atk->spd->def->res
		var mergeOrder = ["hp","atk","spd","def","res"];
		var boostPriority = {"hp":4,"atk":3,"spd":2,"def":1,"res":0};
		mergeOrder.sort(function(a,b){
			if(base[a]>base[b]){
				return -1;
			}
			else if(base[a]<base[b]){
				return 1;
			}
			else{
				if(boostPriority[a]>boostPriority[b]){
					return -1;
				}
				else{
					return 1;
				}
			}
		});

		var mergeBoostCount = challengerMerge*2;
		for(var i = 0; i < mergeBoostCount; i++){
			mergeBoost[mergeOrder[i%5]]++;
		}

		challengerHp += mergeBoost.hp;
		challengerAtk += mergeBoost.atk;
		challengerSpd += mergeBoost.spd;
		challengerDef += mergeBoost.def;
		challengerRes += mergeBoost.res;

		//Add stats based on skills
		//Weapons only affect spd and atk right now
		if(challengerWeapon != -1){
			challengerAtk += skills[challengerWeapon].atk;
			challengerSpd += skills[challengerWeapon].spd;
		}

		//A-passive only one that affects stats
		if(challengerA != -1){
			challengerHp += skills[challengerA].hp;
			challengerAtk += skills[challengerA].atk;
			challengerSpd += skills[challengerA].spd;
			challengerDef += skills[challengerA].def;
			challengerRes += skills[challengerA].res;
		}
	}
}

function setEnemies(){
	//sets enemies based on includerules
	//also updates enemy count display
	//Must be run before setEnemyStats() or setEnemySkills();
	enemyData = [];
	for(var i = 0; i < heroes.length;i++){
		var confirmed = true;
		//check color
		if(!include[heroes[i].color]){
			confirmed = false;
		}
		//check move type
		else if(!include[heroes[i].movetype]){		
			confirmed = false;
		}
		//check weapon range
		else if(!include["melee"] && meleeWeapons.indexOf(heroes[i].weapontype)>=0){
			confirmed = false;
		}
		else if(!include["ranged"] && rangedWeapons.indexOf(heroes[i].weapontype)>=0){
			confirmed = false;
		}
		//check weapon attack type
		else if(!include["physical"] && physicalWeapons.indexOf(heroes[i].weapontype)>=0){
			confirmed = false;
		}
		else if(!include["magical"] && magicalWeapons.indexOf(heroes[i].weapontype)>=0){
			confirmed = false;
		}
		else if(!include["staff"] && heroes[i].weapontype == "staff"){
			confirmed = false;
		}
		else if(!include["nonstaff"] && heroes[i].weapontype != "staff"){
			confirmed = false;
		}
		if(confirmed){
			enemyData.push({"index":i,"name":heroes[i].name,"weapontype":heroes[i].weapontype,"color":heroes[i].color,"movetype":heroes[i].movetype,"hp":0,"atk":0,"spd":0,"def":0,"res":0,"weapon":-1,"special":-1,"a":-1,"b":-1,"c":-1});
		}
	}
	$("#enemies_count").html(enemyData.length);
}

function setEnemySkills(){
	//Sets enemy skills for easy reference during calculation
	//setEnemies() should be called before this
	for(var i = 0; i < enemyData.length;i++){
		//Set default skills
		enemyData[i].weapon = heroMaxSkills[enemyData[i].index].weapon;	
		enemyData[i].special = heroMaxSkills[enemyData[i].index].special;
		enemyData[i].a = heroMaxSkills[enemyData[i].index].a;
		enemyData[i].b = heroMaxSkills[enemyData[i].index].b;
		enemyData[i].c = heroMaxSkills[enemyData[i].index].c;

		//Find if skill needs replacement based on inputs
		if(enemiesWeapon != -1 && (enemiesReplaceWeapon || enemyData[i].weapon == -1)){
			if(heroPossibleSkills[enemyData[i].index].includes(enemiesWeapon)){
				enemyData[i].weapon = enemiesWeapon;
			}
		}
		if(enemiesSpecial != -1 && (enemiesReplaceSpecial || enemyData[i].special == -1)){
			if(heroPossibleSkills[enemyData[i].index].includes(enemiesSpecial)){
				enemyData[i].special = enemiesSpecial;
			}
		}
		if(enemiesA != -1 && (enemiesReplaceA || enemyData[i].a == -1)){
			if(heroPossibleSkills[enemyData[i].index].includes(enemiesA)){
				enemyData[i].a = enemiesA;
			}
		}
		if(enemiesB != -1 && (enemiesReplaceB || enemyData[i].b == -1)){
			if(heroPossibleSkills[enemyData[i].index].includes(enemiesB)){
				enemyData[i].b = enemiesB;
			}
		}
		if(enemiesC != -1 && (enemiesReplaceC || enemyData[i].c == -1)){
			if(heroPossibleSkills[enemyData[i].index].includes(enemiesC)){
				enemyData[i].c = enemiesC;
			}
		}
	}
}

function setEnemyStats(){
	//Get average enemy stats and set specific enemy stats
	//setEnemySkills() should be called before this
	enemyAvgHp = 0;
	enemyAvgAtk = 0;
	enemyAvgSpd = 0;
	enemyAvgDef = 0;
	enemyAvgRes = 0;

	for(var i = 0; i < enemyData.length;i++){
		var hpBoonVal = parseInt($("#enemies_boon_hp").attr("data-val"));
		var atkBoonVal = parseInt($("#enemies_boon_atk").attr("data-val"));
		var spdBoonVal = parseInt($("#enemies_boon_spd").attr("data-val"));
		var defBoonVal = parseInt($("#enemies_boon_def").attr("data-val"));
		var resBoonVal = parseInt($("#enemies_boon_res").attr("data-val"));

		var base = {};
		base.hp = heroes[enemyData[i].index].basehp + hpBoonVal;
		base.atk = heroes[enemyData[i].index].baseatk + atkBoonVal;
		base.spd = heroes[enemyData[i].index].basespd + spdBoonVal;
		base.def = heroes[enemyData[i].index].basedef + defBoonVal;
		base.res = heroes[enemyData[i].index].baseres + resBoonVal;

		enemyData[i].hp = base.hp + growths[heroes[enemyData[i].index].hpgrowth + hpBoonVal];
		enemyData[i].atk = base.atk + growths[heroes[enemyData[i].index].atkgrowth + atkBoonVal];
		enemyData[i].spd = base.spd + growths[heroes[enemyData[i].index].spdgrowth + spdBoonVal];
		enemyData[i].def = base.def + growths[heroes[enemyData[i].index].defgrowth + defBoonVal];
		enemyData[i].res = base.res + growths[heroes[enemyData[i].index].resgrowth + resBoonVal];

		//Add merge bonuses
		var mergeBoost = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};

		//Order that merges happen is highest base stats, tiebreakers go hp->atk->spd->def->res
		var mergeOrder = ["hp","atk","spd","def","res"];
		var boostPriority = {"hp":4,"atk":3,"spd":2,"def":1,"res":0};
		mergeOrder.sort(function(a,b){
			if(base[a]>base[b]){
				return -1;
			}
			else if(base[a]<base[b]){
				return 1;
			}
			else{
				if(boostPriority[a]>boostPriority[b]){
					return -1;
				}
				else{
					return 1;
				}
			}
		});

		var mergeBoostCount = enemiesMerge*2;
		for(var j = 0; j < mergeBoostCount; j++){
			mergeBoost[mergeOrder[j%5]]++;
		}

		enemyData[i].hp += mergeBoost.hp;
		enemyData[i].atk += mergeBoost.atk;
		enemyData[i].spd += mergeBoost.spd;
		enemyData[i].def += mergeBoost.def;
		enemyData[i].res += mergeBoost.res;

		//Add stats based on skills
		//Weapons only affect spd and atk right now
		if(enemyData[i].weapon != -1){
			enemyData[i].atk += skills[enemyData[i].weapon].atk;
			enemyData[i].spd += skills[enemyData[i].weapon].spd;
		}

		//A-passive only one that affects stats
		if(enemyData[i].a != -1){
			enemyData[i].hp += skills[enemyData[i].a].hp;
			enemyData[i].atk += skills[enemyData[i].a].atk;
			enemyData[i].spd += skills[enemyData[i].a].spd;
			enemyData[i].def += skills[enemyData[i].a].def;
			enemyData[i].res += skills[enemyData[i].a].res;
		}

		enemyAvgHp += enemyData[i].hp;
		enemyAvgAtk += enemyData[i].atk;
		enemyAvgSpd += enemyData[i].spd;
		enemyAvgDef += enemyData[i].def;
		enemyAvgRes += enemyData[i].res;
	}
	enemyAvgHp = Math.round(enemyAvgHp/enemyData.length);
	enemyAvgAtk = Math.round(enemyAvgAtk/enemyData.length);
	enemyAvgSpd = Math.round(enemyAvgSpd/enemyData.length);
	enemyAvgDef = Math.round(enemyAvgDef/enemyData.length);
	enemyAvgRes = Math.round(enemyAvgRes/enemyData.length);
}

function setUI(){
	if(challengerIndex != -1){
		$("#challenger_picture").attr("src","heroes/" + heroes[challengerIndex].name + ".png");
		$("#hero_hp").html(challengerHp);
		$("#hero_atk").html(challengerAtk);
		$("#hero_spd").html(challengerSpd);
		$("#hero_def").html(challengerDef);
		$("#hero_res").html(challengerRes);
		if(heroes[challengerIndex].weapontype != "dragon"){
			$("#weaponIcon").attr("src","weapons/" + heroes[challengerIndex].weapontype + ".png");
		}
		else{
			$("#weaponIcon").attr("src","weapons/" + heroes[challengerIndex].color + "dragon.png");
		}

		if(challengerSpecial != -1){
			var specialCharge = skills[challengerSpecial].charge;
			if(challengerWeapon != -1){
				var weaponName = skills[challengerWeapon].name;
				if(weaponName.includes("Killer") || weaponName.includes("Killing") || weaponName.includes("Mystletainn") || weaponName.includes("Hauteclere")){
					specialCharge -= 1;
				}
				else if(weaponName.includes("Raudrblade") || weaponName.includes("Lightning Breath") || weaponName.includes("Blarblade") || weaponName.includes("Gronnblade")){
					specialCharge += 1;
				}
				specialCharge -= challengerPrecharge;
				specialCharge = Math.max(0,specialCharge);
			}
			$("#challenger_specialcharge").html(specialCharge);
		}
		else{
			$("#challenger_specialcharge").html("-");
		}
	}

	if(enemyData.length > 0){
		$("#enemies_hp").html(enemyAvgHp);
		$("#enemies_atk").html(enemyAvgAtk);
		$("#enemies_spd").html(enemyAvgSpd);
		$("#enemies_def").html(enemyAvgDef);
		$("#enemies_res").html(enemyAvgRes);
	}
	else{
		$("#enemies_hp").html("-");
		$("#enemies_atk").html("-");
		$("#enemies_spd").html("-");
		$("#enemies_def").html("-");
		$("#enemies_res").html("-");
	}
	
}

function getSkillIndexFromId(skillid){
	var index = -1;
	for(var i = 0; i < skills.length; i++){
		if(skills[i].skill_id == skillid){
			index = i;
			break;
		}
	}
	//console.log("Looked for index of skill id " + skillid + "; found at " + index);
	return index;
}

function fight(enemyIndex){
	//returns object with: challengerHp, enemyHp, rounds, and enemy object for stripping skills

	var fightText = "";

	var challenger = new activeHero(challengerIndex,true);
	var enemy  = new activeHero(enemyIndex);

	var rounds = 0;

	for(var round = 1; round <= roundInitiators.length;round++){
		rounds = round;
		var turn = startTurn + round - 1;
		fightText += "<div class=\"fight_round\"><span class=\"bold\">Round " + round + ": ";
		if(roundInitiators[round-1]=="Challenger initiates"){
			fightText += challenger.name + " initiates</span><br>";
			fightText += challenger.attack(enemy,turn);
		}
		else{
			fightText += enemy.name + " initiates</span><br>";
			fightText +=  enemy.attack(challenger,turn);
		}
		if(enemy.hp <= 0 || challenger.hp <= 0){
			break;
		}
		fightText += "</div>";
	}

	//Have to make copy of enemy object
	return {"challengerHp":Math.max(challenger.hp,0),"enemyHp":Math.max(enemy.hp,0),"rounds":rounds,"fightText":fightText,"enemy":$.extend({},enemy)};
}

function calcuWait(ms){//har har har
	//Waits to calculate on inputs like numbers that may be clicked a lot in a short time
	calcuwaitTime = ms;
	if(!calcuwaiting){
		calcuwaiting = true;
		calcuwaitTimer();
	}
}

function calcuwaitTimer(){
	if(calcuwaitTime <= 0){
		calcuwaiting = false;
		calculate();
	}
	else{
		calcuwaitTime -= 50;
		setTimeout(calcuwaitTimer,50);
	}
}

function calculate(){
	//calculates results and also adds them to page
	if(challengerIndex!=-1 && roundInitiators.length > 0 && enemyData.length > 0){
		var wins = 0;
		var losses = 0;
		var inconclusive = 0;

		fightResults = [];
		resultHTML = [];

		for(var i = 0;i<enemyData.length;i++){
			fightResults.push(fight(i));
		}

		fightResults.sort(function(a,b){
			//sort fights from best wins to worst losses
			//first by win, then by rounds, then by hp
			var comparison = 0;
			if(a.enemyHp==0){
				if(b.enemyHp!=0){
					comparison = -1;
				}
				else{
					if(a.rounds<b.rounds){
						comparison = -1;
					}
					else if(a.rounds>b.rounds){
						comparison = 1;
					}
					else{
						if(a.challengerHp>b.challengerHp){
							comparison = -1;
						}
						else if(a.challengerHp<b.challengerHp){
							comparison = 1;
						}
						else{
							comparison = 0;
						}
					}
				}
			}
			else if(a.challengerHp==0){
				if(b.challengerHp!=0){
					comparison = 1;
				}
				else{
					if(a.rounds<b.rounds){
						comparison = 1;
					}
					else if(a.rounds>b.rounds){
						comparison = -1;
					}
					else{
						//sort by enemy hp taken instead of challenger hp
						if(a.enemy.maxHp-a.enemyHp>b.enemy.maxHp-b.enemyHp){
							comparison = -1;
						}
						else if(a.enemy.maxHp-a.enemyHp<b.enemy.maxHp-b.enemyHp){
							comparison = 1;
						}
						else{
							comparison = 0;
						}
					}
				}
			}
			else{
				if(b.enemyHp==0){
					comparison = 1;
				}
				else if(b.challengerHp==0){
					comparison = -1;
				}
				else{
					//in a stalemate, rounds will always be max, so can't sort by rounds
					if(a.challengerHp>b.challengerHp){
						comparison = -1;
					}
					else if(a.challengerHp<b.challengerHp){
						comparison = 1;
					}
					else{
						if(a.enemyHp<b.enemyHp){
							comparison = -1;
						}
						else if(a.enemyHp>b.enemyHp){
							comparison = 1;
						}
						else{
							comparison = 0;
						}
					}
				}
			}

			return comparison;
		});

		for(var i = 0; i < fightResults.length;i++){
			var resultText = "";

			if(fightResults[i].challengerHp==0){
				losses++;
				resultText = "<span class=\"red\">loss</span>, " + fightResults[i].rounds;
				if(fightResults[i].rounds==1){
					resultText += " round";
				}
				else{
					resultText += " rounds";
				}
			}
			else if(fightResults[i].enemyHp==0){
				wins++;
				resultText = "<span class=\"blue\">win</span>, " + fightResults[i].rounds;
				if(fightResults[i].rounds==1){
					resultText += " round";
				}
				else{
					resultText += " rounds";
				}
			}
			else{
				inconclusive++;
				resultText = "inconclusive";
			}

			var weaponName = "None";
			var specialName = "None";
			var aName = "noskill";
			var bName = "noskill";
			var cName = "noskill";
			if(fightResults[i].enemy.weaponIndex != -1){
				weaponName = skills[fightResults[i].enemy.weaponIndex].name;
			}
			if(fightResults[i].enemy.specialIndex != -1){
				specialName = skills[fightResults[i].enemy.specialIndex].name;
			}
			if(fightResults[i].enemy.aIndex != -1){
				aName = skills[fightResults[i].enemy.aIndex].name.replace(/\s/g,"_");
			}
			if(fightResults[i].enemy.bIndex != -1){
				bName = skills[fightResults[i].enemy.bIndex].name.replace(/\s/g,"_");
			}
			if(fightResults[i].enemy.cIndex != -1){
				cName = skills[fightResults[i].enemy.cIndex].name.replace(/\s/g,"_");
			}

			var weaponTypeName = fightResults[i].enemy.weaponType;
			if(weaponTypeName == "dragon"){
				weaponTypeName = fightResults[i].enemy.color + "dragon";
			}

			resultHTML.push(["<div class=\"results_entry\" id=\"result_" + i + "\" onmouseover=\"showResultsTooltip(event,this);\" onmouseout=\"hideResultsTooltip();\">",
				"<div class=\"results_hpbox\">",
					"<div class=\"results_hplabel\">HP</div>",
					"<div class=\"results_hpnums\">",
						"<span class=\"results_challengerhp\">" + fightResults[i].challengerHp + "</span> &ndash; <span class=\"results_enemyhp\">" + fightResults[i].enemyHp + "</span>",
					"</div>",
				"</div>",
				"<div class=\"frame_enemypicture\"><img class=\"results_enemypicture\" src=\"heroes/" + fightResults[i].enemy.name + ".png\"/></div>",
				"<div class=\"results_topline\">",
					"<img class=\"weaponIconSmall\" src=\"weapons/" + weaponTypeName + ".png\"/><span class=\"results_enemyname\">" + fightResults[i].enemy.name + "</span> (<span class=\"results_outcome\">" + resultText + "</span>)",
					"<div class=\"results_previousresult\">" + previousFightResults[fightResults[i].enemy.heroIndex] + "</div>",
				"</div>",
				"<div class=\"results_bottomline\">",
					"<span class=\"results_stat\">HP: " + fightResults[i].enemy.maxHp + "</span><span class=\"results_stat\">Atk: " + fightResults[i].enemy.atk + "</span><span class=\"results_stat\">Spd: " + fightResults[i].enemy.spd + "</span><span class=\"results_stat\">Def: " + fightResults[i].enemy.def + "</span><span class=\"results_stat\">Res: " + fightResults[i].enemy.res + "</span><div class=\"results_skills\"><span class=\"results_stat\"><img class=\"skill_picture\" src=\"skills/weapon.png\"/>" + weaponName + "</span><span class=\"results_stat\"><img class=\"skill_picture\" src=\"skills/special.png\"/>" + specialName + "</span><span class=\"results_stat\"><img class=\"skill_picture\" src=\"skills/" + aName + ".png\"/><img class=\"skill_picture\" src=\"skills/" + bName + ".png\"/><img class=\"skill_picture\" src=\"skills/" + cName + ".png\"/></span></div>",
				"</div>",
			"</div>",""].join("\n"));

			//Set previous result after showing this result
			previousFightResults[fightResults[i].enemy.heroIndex] = "Previous result: " + resultText + ", <span class=\"blue\">" + fightResults[i].challengerHp + "</span> &ndash; <span class=\"red\">" + fightResults[i].enemyHp + "</span>";
		}

		outputResults();

		var total = wins + losses + inconclusive;
		$("#results_graph_wins").animate({"width":wins/total*906+"px"},200);
		$("#results_graph_losses").animate({"width":losses/total*906+"px"},200);
		$("#win_pct").html(wins);
		$("#lose_pct").html(losses);
		$("#inconclusive_pct").html(inconclusive);
	}
	else{
		$("#results_graph_wins").animate({"width":"0px"},200);
		$("#results_graph_losses").animate({"width":"0px"},200);
		$("#win_pct").html("-");
		$("#lose_pct").html("-");
		$("#inconclusive_pct").html("-");
		$("#results_list").html("");
	}
}

function outputResults(){
	//function separate from calculation so user can re-sort without recalculating
	//sortOrder is 1 or -1
	var sortOrder = parseInt($("#sort_results").val());
	var outputHTML = "";
	if(sortOrder==1){
		for(var i = 0; i < resultHTML.length; i++){
			outputHTML += resultHTML[i];
		}
	}
	else if(sortOrder==-1){
		for(var i = resultHTML.length-1; i >= 0; i--){
			outputHTML += resultHTML[i];
		}
	}
	$("#results_list").html(outputHTML);
}

function showResultsTooltip(e,resultDiv){
	var resultId = resultDiv.id.substring(7);
	showingTooltip = true;
	$("#frame_tooltip").html(fightResults[resultId].fightText).show();
}

function hideResultsTooltip(){
	showingTooltip = false;
	$("#frame_tooltip").hide();
}

function addTurn(turnName){
	if(roundInitiators.length < 4){
		$("#turn_text_" + roundInitiators.length).html(turnName);
		$("#turn_" + roundInitiators.length).show();
		roundInitiators.push(turnName);
	}
	if(autoCalculate){
		calculate();
	}
}

function deleteTurn(initTurn){
	//keep ids the same, shift around text
	$("#turn_" + (roundInitiators.length - 1)).hide();
	roundInitiators.splice(initTurn,1);
	for(var i = 0; i < roundInitiators.length; i++){
		$("#turn_text_" + i).html(roundInitiators[i]);
	}
	if(autoCalculate){
		calculate();
	}
}

function resetChallenger(){
	$("#hero_atk_buff, #hero_spd_buff, #hero_def_buff, #hero_res_buff, #hero_atk_spur, #hero_spd_spur, #hero_def_spur, #hero_res_spur, #challenger_precharge, #challenger_merge, #challenger_damage").val(0);
	//Set skills to default
	resetChallengerSkills();

	$("#hero_boon_hp, #hero_boon_atk, #hero_boon_spd, #hero_boon_def, #hero_boon_res").attr("data-val",0).removeClass("bane").removeClass("boon").addClass("neutral").html("Neutral");

	challengerDamage = 0;
	challengerPrecharge = 0;
	challengerMerge = 0;
	challengerBuffs = {"atk":0,"spd":0,"def":0,"res":0};
	challengerSpur = {"atk":0,"spd":0,"def":0,"res":0};
	
	setStats();
	setUI();

	if(autoCalculate){
		calculate();
	}
}

function resetChallengerSkills(){
	if(challengerIndex != -1){
		challengerWeapon = heroMaxSkills[challengerIndex].weapon;
		challengerSpecial = heroMaxSkills[challengerIndex].special;
		challengerA = heroMaxSkills[challengerIndex].a;
		challengerB = heroMaxSkills[challengerIndex].b;
		challengerC = heroMaxSkills[challengerIndex].c;
	}
	else{
		challengerWeapon = -1;
		challengerSpecial = -1;
		challengerA = -1;
		challengerB = -1;
		challengerC = -1;
	}
	

	$("#hero_weapon").val(challengerWeapon);
	$("#hero_special").val(challengerSpecial);
	$("#hero_a").val(challengerA);
	$("#hero_b").val(challengerB);
	$("#hero_c").val(challengerC);

	changeSkillPic("a",challengerA);
	changeSkillPic("b",challengerB);
	changeSkillPic("c",challengerC);

}

function resetEnemies(){
	$("#enemies_atk_buff, #enemies_spd_buff, #enemies_def_buff, #enemies_res_buff, #enemies_atk_spur, #enemies_spd_spur, #enemies_def_spur, #enemies_res_spur, #enemies_weapon_overwrite, #enemies_special_overwrite, #enemies_a_overwrite, #enemies_b_overwrite, #enemies_c_overwrite, #enemies_merge, #enemies_damage").val(0);
	$("#enemies_weapon").val(-1);
	$("#enemies_special").val(-1);
	$("#enemies_a").val(-1);
	$("#enemies_b").val(-1);
	$("#enemies_c").val(-1);

	enemiesWeapon = -1;
	enemiesSpecial = -1;
	enemiesA = -1;
	enemiesB = -1;
	enemiesC = -1;

	$("#enemies_boon_hp, #enemies_boon_atk, #enemies_boon_spd, #enemies_boon_def, #enemies_boon_res").attr("data-val",0).removeClass("bane").removeClass("boon").addClass("neutral");

	enemyDamage = 0;
	enemyPrecharge = 0;
	enemiesMerge = 0;
	enemyBuffs = {"atk":0,"spd":0,"def":0,"res":0};
	enemySpur = {"atk":0,"spd":0,"def":0,"res":0};

	$(".wideincludebutton, .thinincludebutton").removeClass("notincluded").addClass("included");
	include = {"melee":1,"ranged":1,"red":1,"blue":1,"green":1,"gray":1,"physical":1,"magical":1,"infantry":1,"cavalry":1,"flying":1,"armored":1,"staff":0,"nonstaff":1};
	$("#include_staff").removeClass("included").addClass("notincluded");

	setEnemies();
	setEnemySkills();
	setEnemyStats();
	setUI();

	if(autoCalculate){
		calculate();
	}
}