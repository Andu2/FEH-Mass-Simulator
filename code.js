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
var challengerS = -1;
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

var challengerRarity = 5;
var enemyRarity = 5;

var enemiesWeapon = -1;
var enemiesSpecial = -1;
var enemiesA = -1;
var enemiesB = -1;
var enemiesC = -1;
var enemiesS = -1;

var challengerBoon = "None";
var challengerBane = "None";
var enemiesBoon = "None";
var enemiesBane = "None";

var enemiesReplaceWeapon = false;
var enemiesReplaceSpecial = false;
var enemiesReplaceA = false;
var enemiesReplaceB = false;
var enemiesReplaceC = false;

var heroPossibleSkills = [];
var heroBaseSkills = [];
var heroMaxSkills = [[],[],[],[],[]]; //2d array; 1st num rarity, 2nd num heroindex

var challengerBuffs = {"atk":0,"spd":0,"def":0,"res":0};
var enemyBuffs = {"atk":0,"spd":0,"def":0,"res":0};
var challengerDebuffs = {"atk":0,"spd":0,"def":0,"res":0};
var enemyDebuffs = {"atk":0,"spd":0,"def":0,"res":0};
var challengerSpur = {"atk":0,"spd":0,"def":0,"res":0};
var enemySpur = {"atk":0,"spd":0,"def":0,"res":0};

var startTurn = 0;
var useGaleforce = true;
var threatenRule = "Neither";
var showOnlyMaxSkills = true;
var hideUnaffecting = true;

var viewFilter = 0;
var fightResults = []; //Needs to be global variable to get info for tooltip
var resultHTML = []; //Needs to be a global variable to flip sort order without recalculating
var previousFightResults = new Array(heroes.length); //For comparing between calculations; actually an array of html strings with index corresponding to heroes[] index
var nextPreviousFightResults = new Array(heroes.length); //Dumb
//.fill() doesn't work in older versions of IE
//previousFightResults.fill("");
for(var i = 0; i < previousFightResults.length;i++){
	previousFightResults[i] = "";
	nextPreviousFightResults[i] = "";
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
//growth table from https://feheroes.wiki/Stat_Growth
var growths = [[6,8,9,11,13,14,16,18,19,21,23,24],
[7,8,10,12,14,15,17,19,21,23,25,26],
[7,9,11,13,15,17,19,21,23,25,27,29],
[8,10,12,14,16,18,20,22,24,26,28,31],
[8,10,13,15,17,19,22,24,26,28,30,33]];

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
var allSSkills = getValidSkills("s");

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
	for(var j = 0; j < 5; j++){
		heroMaxSkills[j].push(findMaxSkills(j,i));
	}
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
			validSSkills = getValidSkills("s",challengerIndex);
			setSkillOptions();

			challengerWeapon = heroMaxSkills[challengerRarity-1][challengerIndex].weapon;
			challengerSpecial = heroMaxSkills[challengerRarity-1][challengerIndex].special;
			challengerA = heroMaxSkills[challengerRarity-1][challengerIndex].a;
			challengerB = heroMaxSkills[challengerRarity-1][challengerIndex].b;
			challengerC = heroMaxSkills[challengerRarity-1][challengerIndex].c;

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
		var newVal = verifyNumberInput(this,0,10);
		challengerMerge = newVal;
		setStats();
		setUI();
		if(autoCalculate){
			calcuWait(300);
		}
	});
	$("#enemies_merge").change(function(){
		var newVal = verifyNumberInput(this,0,10);
		enemiesMerge = newVal;
		setEnemyStats();
		setUI();
		if(autoCalculate){
			calcuWait(300);
		}
	});

	$("#challenger_damage").change(function(){
		var newVal = verifyNumberInput(this,0,99);
		challengerDamage = newVal;
		setUI();
		if(autoCalculate){
			calcuWait(300);
		}
	});
	$("#enemies_damage").change(function(){
		var newVal = verifyNumberInput(this,0,99);
		enemyDamage = newVal;
		if(autoCalculate){
			calcuWait(300);
		}
	});

	$("#challenger_precharge").change(function(){
		var newVal = verifyNumberInput(this,0,6);
		challengerPrecharge = newVal;
		setUI();
		if(autoCalculate){
			calcuWait(300);
		}
	});
	$("#enemies_precharge").change(function(){
		var newVal = verifyNumberInput(this,0,6);
		setUI();
		enemyPrecharge = newVal;
		if(autoCalculate){
			calcuWait(300);
		}
	});

	$("#challenger_rarity").change(function(){
		var newVal = verifyNumberInput(this,1,5);
		challengerRarity = newVal;
		setSkillOptions();
		challengerWeapon = heroMaxSkills[challengerRarity-1][challengerIndex].weapon;
		challengerSpecial = heroMaxSkills[challengerRarity-1][challengerIndex].special;
		challengerA = heroMaxSkills[challengerRarity-1][challengerIndex].a;
		challengerB = heroMaxSkills[challengerRarity-1][challengerIndex].b;
		challengerC = heroMaxSkills[challengerRarity-1][challengerIndex].c;
		setStats();
		$("#hero_weapon").val(challengerWeapon);
		$("#hero_special").val(challengerSpecial);
		$("#hero_a").val(challengerA);
		$("#hero_b").val(challengerB);
		$("#hero_c").val(challengerC);
		setUI();
		if(autoCalculate){
			calcuWait(300);
		}
	});
	$("#enemies_rarity").change(function(){
		var newVal = verifyNumberInput(this,1,5);
		enemyRarity = newVal;
		setEnemySkills();
		setEnemyStats();
		setUI();
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
		var newVal = verifyNumberInput(this,0,7);
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

	$(".debuff_input").change(function(){
		var newVal = verifyNumberInput(this,-7,0);
		var debuffStat = this.id.substring(this.id.length-10,this.id.length-7);
		if(this.id.substring(0,4)=="hero"){
			challengerDebuffs[debuffStat] = newVal;
		}
		else if(this.id.substring(0,7)=="enemies"){
			enemyDebuffs[debuffStat] = newVal;
		}

		setUI();

		if(autoCalculate){
			calcuWait(300);
		}
	});

	$(".spur_input").change(function(){
		var newVal = verifyNumberInput(this,0,12);
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

	$("#challenger_boon").change(function(){
		challengerBoon = $(this).val();
		setStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});
	$("#challenger_bane").change(function(){
		challengerBane = $(this).val();
		setStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});

	$("#enemies_boon").change(function(){
		enemiesBoon = $(this).val();
		setEnemyStats();
		setUI();
		if(autoCalculate){
			calculate();
		}
	});
	$("#enemies_bane").change(function(){
		enemiesBane = $(this).val();
		setEnemyStats();
		setUI();
		if(autoCalculate){
			calculate();
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
	$("#hero_s").change(function(){
		challengerS = parseInt($(this).val());
		if(challengerS != -1){
			dataLayer.push({"event":"changeSkill","skill_name":"s_" + skills[challengerS].name});
		}
		changeSkillPic("s",challengerS);
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
	$("#enemies_s").change(function(){
		enemiesS = parseInt($(this).val());
		changeEnemiesSkillPic("s",enemiesS);
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
			showOnlyMaxSkills = true;
			if(challengerIndex != -1){
				setSkillOptions();
				resetChallengerSkills();
			}	
		}
		else{
			showOnlyMaxSkills = false;
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

	$("#rules_hideunaffecting").change(function(){
		if($(this).is(":checked")){
			hideUnaffecting = true;
			if(challengerIndex != -1){
				setSkillOptions();
				resetChallengerSkills();
			}	
		}
		else{
			hideUnaffecting = false;
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
		var newVal = $(this).val();
		threatenRule = newVal;
		if(autoCalculate){
			calculate();
		}
	});

	$("#rules_renewal").change(function(){
		var newVal = verifyNumberInput(this,0,3);
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

	$("#view_results").change(function(){
		var newVal = verifyNumberInput(this,0,2);
		viewFilter = newVal;
		outputResults();
	});

	$("#sort_results").change(function(){
		outputResults();
	});

	$("#import_exit").click(function(){
		hideImportDialog();
	})

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
			if(heroindex != undefined){
				//console.log("Trying " + slot + ": " + skills[i].name);
				if(skills[i].inheritrule == "unique"){
					//can only use if hero starts with it
					for(var j = 0; j < challengerBaseSkills.length; j++){
						if(challengerBaseSkills[j][0] == skills[i].skill_id){
							validSkills.push(i);
						}
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
	//returns an array of arrays of skill-rarity pairs
	var skillset = [];
	for(var i = 0; i < heroskills.length;i++){
		if(heroskills[i].hero_id==heroes[heroid].hero_id){
			var skillPair = [heroskills[i].skill_id,heroskills[i].rarity];
			skillset.push(skillPair);
		}
	}
	return skillset;
}

function findMaxSkills(rarity,heroid){
	//Finds max skills ased on rarity
	//Gets one with highest sp cost
	var maxskillset = {"weapon":-1,"special":-1,"a":-1,"b":-1,"c":-1};
	for(var i = 0; i < heroBaseSkills[heroid].length;i++){
		var skillIndex = getSkillIndexFromId(heroBaseSkills[heroid][i][0]);
		var skill = skills[skillIndex];
		if((skill.slot != "s" && skill.slot != "assist") && heroBaseSkills[heroid][i][1] <= rarity + 1){
			if(maxskillset[skill.slot]==-1){
				maxskillset[skill.slot] = skillIndex;
			}
			else{
				if(skills[maxskillset[skill.slot]].sp < skill.sp){
					maxskillset[skill.slot] = skillIndex;
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
		if(((!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[validWeaponSkills[i]].skill_id)==-1) && (!hideUnaffecting || skills[validWeaponSkills[i]].affectsduel)) || validWeaponSkills[i] == heroMaxSkills[challengerRarity-1][challengerIndex].weapon){
			weaponHTML += "<option value=" + validWeaponSkills[i] + ">" + skills[validWeaponSkills[i]].name + "</option>";
		}
	}
	$("#hero_weapon").html(weaponHTML);

	//Set special skill options
	specialHTML = "<option value=-1>No special</option>";
	for(var i = 0; i < validSpecialSkills.length; i++){
		if(((!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[validSpecialSkills[i]].skill_id)==-1) && (!hideUnaffecting || skills[validSpecialSkills[i]].affectsduel)) || validSpecialSkills[i] == heroMaxSkills[challengerRarity-1][challengerIndex].special){
			specialHTML += "<option value=" + validSpecialSkills[i] + ">" + skills[validSpecialSkills[i]].name + "</option>";
		}
	}
	$("#hero_special").html(specialHTML);

	//Set a skill options
	aHTML = "<option value=-1>No A passive</option>";
	for(var i = 0; i < validASkills.length; i++){
		if(((!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[validASkills[i]].skill_id)==-1) && (!hideUnaffecting || skills[validASkills[i]].affectsduel)) || validASkills[i] == heroMaxSkills[challengerRarity-1][challengerIndex].a){
			aHTML += "<option value=" + validASkills[i] + ">" + skills[validASkills[i]].name + "</option>";
		}
	}
	$("#hero_a").html(aHTML);

	//Set weapon skill options
	bHTML = "<option value=-1>No B passive</option>";
	for(var i = 0; i < validBSkills.length; i++){
		if(((!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[validBSkills[i]].skill_id)==-1) && (!hideUnaffecting || skills[validBSkills[i]].affectsduel)) || validBSkills[i] == heroMaxSkills[challengerRarity-1][challengerIndex].b){
			bHTML += "<option value=" + validBSkills[i] + ">" + skills[validBSkills[i]].name + "</option>";
		}
	}
	$("#hero_b").html(bHTML);

	//Set c skill options
	cHTML = "<option value=-1>No C passive</option>";
	for(var i = 0; i < validCSkills.length; i++){
		if(((!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[validCSkills[i]].skill_id)==-1) && (!hideUnaffecting || skills[validCSkills[i]].affectsduel)) || validCSkills[i] == heroMaxSkills[challengerRarity-1][challengerIndex].c){
			cHTML += "<option value=" + validCSkills[i] + ">" + skills[validCSkills[i]].name + "</option>";
		}
	}
	$("#hero_c").html(cHTML);

	//Set s skill options
	sHTML = "<option value=-1>No S passive</option>";
	for(var i = 0; i < validSSkills.length; i++){
		if((!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[validSSkills[i]].skill_id)==-1) && (!hideUnaffecting || skills[validSSkills[i]].affectsduel)){
			sHTML += "<option value=" + validSSkills[i] + ">" + skills[validSSkills[i]].name + "</option>";
		}
	}
	$("#hero_s").html(sHTML);

}

function setEnemySkillOptions(){
	//set html for enemies skill select

	//Set weapon skill options
	weaponHTML = "<option value=-1>No weapon</option>";
	for(var i = 0; i < allWeaponSkills.length; i++){
		if((!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[allWeaponSkills[i]].skill_id)==-1) && (!hideUnaffecting || skills[allWeaponSkills[i]].affectsduel)){
			weaponHTML += "<option value=" + allWeaponSkills[i] + ">" + skills[allWeaponSkills[i]].name + "</option>";
		}
	}
	$("#enemies_weapon").html(weaponHTML);

	//Set special skill options
	specialHTML = "<option value=-1>No special</option>";
	for(var i = 0; i < allSpecialSkills.length; i++){
		if((!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[allSpecialSkills[i]].skill_id)==-1) && (!hideUnaffecting || skills[allWeaponSkills[i]].affectsduel)){
			specialHTML += "<option value=" + allSpecialSkills[i] + ">" + skills[allSpecialSkills[i]].name + "</option>";
		}
	}
	$("#enemies_special").html(specialHTML);

	//Set a skill options
	aHTML = "<option value=-1>No A passive</option>";
	for(var i = 0; i < allASkills.length; i++){
		if((!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[allASkills[i]].skill_id)==-1) && (!hideUnaffecting || skills[allWeaponSkills[i]].affectsduel)){
			aHTML += "<option value=" + allASkills[i] + ">" + skills[allASkills[i]].name + "</option>";
		}
	}
	$("#enemies_a").html(aHTML);

	//Set weapon skill options
	bHTML = "<option value=-1>No B passive</option>";
	for(var i = 0; i < allBSkills.length; i++){
		if((!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[allBSkills[i]].skill_id)==-1) && (!hideUnaffecting || skills[allWeaponSkills[i]].affectsduel)){
			bHTML += "<option value=" + allBSkills[i] + ">" + skills[allBSkills[i]].name + "</option>";
		}
	}
	$("#enemies_b").html(bHTML);

	//Set c skill options
	cHTML = "<option value=-1>No C passive</option>";
	for(var i = 0; i < allCSkills.length; i++){
		if((!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[allCSkills[i]].skill_id)==-1) && (!hideUnaffecting || skills[allWeaponSkills[i]].affectsduel)){
			cHTML += "<option value=" + allCSkills[i] + ">" + skills[allCSkills[i]].name + "</option>";
		}
	}
	$("#enemies_c").html(cHTML);

	//Set s skill options
	sHTML = "<option value=-1>No S passive</option>";
	for(var i = 0; i < allSSkills.length; i++){
		if((!showOnlyMaxSkills || skillsThatArePrereq.indexOf(skills[allSSkills[i]].skill_id)==-1) && (!hideUnaffecting || skills[allWeaponSkills[i]].affectsduel)){
			sHTML += "<option value=" + allSSkills[i] + ">" + skills[allSSkills[i]].name + "</option>";
		}
	}
	$("#enemies_s").html(sHTML);
}

function setStats(){
	if(challengerIndex != -1){
		var growthValMod = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
		if(challengerBoon!="none"){
			growthValMod[challengerBoon]+=1;
		}
		if(challengerBane!="none"){
			growthValMod[challengerBane]-=1;
		}

		var base = {};
		base.hp = heroes[challengerIndex].basehp + growthValMod.hp;
		base.atk = heroes[challengerIndex].baseatk + growthValMod.atk;
		base.spd = heroes[challengerIndex].basespd + growthValMod.spd;
		base.def = heroes[challengerIndex].basedef + growthValMod.def;
		base.res = heroes[challengerIndex].baseres + growthValMod.res;

		challengerHp = base.hp + growths[challengerRarity-1][heroes[challengerIndex].hpgrowth + growthValMod.hp];
		challengerAtk = base.atk + growths[challengerRarity-1][heroes[challengerIndex].atkgrowth + growthValMod.atk];
		challengerSpd = base.spd + growths[challengerRarity-1][heroes[challengerIndex].spdgrowth + growthValMod.spd];
		challengerDef = base.def + growths[challengerRarity-1][heroes[challengerIndex].defgrowth + growthValMod.def];
		challengerRes = base.res + growths[challengerRarity-1][heroes[challengerIndex].resgrowth + growthValMod.res];

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

		if(challengerRarity<5){
			//Modify base stats based on rarity
			//Order that base stats increase by rarity is similar to merge bonuses, except HP always happens at 3* and 5*
			//Rarity base boosts don't taken into account boons/banes, so modify bases again and sort again
			base.atk = base.atk - growthValMod.atk;
			base.spd = base.spd - growthValMod.spd;
			base.def = base.def - growthValMod.def;
			base.res = base.res - growthValMod.res;

			var rarityBaseOrder = ["atk","spd","def","res"];
			rarityBaseOrder.sort(function(a,b){
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

			rarityBaseOrder.push("hp");
			var rarityBoostCount = Math.floor((challengerRarity-1) * 2.5);

			//Just going to dump these stat boosts in mergeBoost
			for(var i = 0; i < rarityBoostCount; i++){
				mergeBoost[rarityBaseOrder[i%5]]++;
			}

			//Subtract 2 from every stat since bases are pulled in at 5*
			mergeBoost.hp -= 2;
			mergeBoost.atk -= 2;
			mergeBoost.spd -= 2;
			mergeBoost.def -= 2;
			mergeBoost.res -= 2;
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

		//A-passive and S only ones that affects stats
		if(challengerA != -1){
			challengerHp += skills[challengerA].hp;
			challengerAtk += skills[challengerA].atk;
			challengerSpd += skills[challengerA].spd;
			challengerDef += skills[challengerA].def;
			challengerRes += skills[challengerA].res;
		}

		if(challengerS != -1){
			challengerHp += skills[challengerS].hp;
			challengerAtk += skills[challengerS].atk;
			challengerSpd += skills[challengerS].spd;
			challengerDef += skills[challengerS].def;
			challengerRes += skills[challengerS].res;
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
		enemyData[i].weapon = heroMaxSkills[enemyRarity-1][enemyData[i].index].weapon;	
		enemyData[i].special = heroMaxSkills[enemyRarity-1][enemyData[i].index].special;
		enemyData[i].a = heroMaxSkills[enemyRarity-1][enemyData[i].index].a;
		enemyData[i].b = heroMaxSkills[enemyRarity-1][enemyData[i].index].b;
		enemyData[i].c = heroMaxSkills[enemyRarity-1][enemyData[i].index].c;
		enemyData[i].s = -1;

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
		if(enemiesS != -1){
			if(heroPossibleSkills[enemyData[i].index].includes(enemiesS)){
				enemyData[i].s = enemiesS;
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
		var growthValMod = {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
		if(enemiesBoon!="none"){
			growthValMod[enemiesBoon]+=1;
		}
		if(enemiesBane!="none"){
			growthValMod[enemiesBane]-=1;
		}

		var base = {};
		base.hp = heroes[enemyData[i].index].basehp + growthValMod.hp;
		base.atk = heroes[enemyData[i].index].baseatk + growthValMod.atk;
		base.spd = heroes[enemyData[i].index].basespd + growthValMod.spd;
		base.def = heroes[enemyData[i].index].basedef + growthValMod.def;
		base.res = heroes[enemyData[i].index].baseres + growthValMod.res;

		enemyData[i].hp = base.hp + growths[enemyRarity-1][heroes[enemyData[i].index].hpgrowth + growthValMod.hp];
		enemyData[i].atk = base.atk + growths[enemyRarity-1][heroes[enemyData[i].index].atkgrowth + growthValMod.atk];
		enemyData[i].spd = base.spd + growths[enemyRarity-1][heroes[enemyData[i].index].spdgrowth + growthValMod.spd];
		enemyData[i].def = base.def + growths[enemyRarity-1][heroes[enemyData[i].index].defgrowth + growthValMod.def];
		enemyData[i].res = base.res + growths[enemyRarity-1][heroes[enemyData[i].index].resgrowth + growthValMod.res];

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

		if(enemyRarity<5){
			//Modify base stats based on rarity
			//Order that base stats increase by rarity is similar to merge bonuses, except HP always happens at 3* and 5*
			//Rarity base boosts don't taken into account boons/banes, so modify bases again and sort again
			base.atk = base.atk - growthValMod.atk;
			base.spd = base.spd - growthValMod.spd;
			base.def = base.def - growthValMod.def;
			base.res = base.res - growthValMod.res;

			var rarityBaseOrder = ["atk","spd","def","res"];
			rarityBaseOrder.sort(function(a,b){
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

			rarityBaseOrder.push("hp");
			var rarityBoostCount = Math.floor((enemyRarity-1) * 2.5);

			//Just going to dump these stat boosts in mergeBoost
			for(var j = 0; j < rarityBoostCount; j++){
				mergeBoost[rarityBaseOrder[i%5]]++;
			}

			//Subtract 2 from every stat since bases are pulled in at 5*
			mergeBoost.hp -= 2;
			mergeBoost.atk -= 2;
			mergeBoost.spd -= 2;
			mergeBoost.def -= 2;
			mergeBoost.res -= 2;
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

		//A-passive and S only one that affects stats
		if(enemyData[i].a != -1){
			enemyData[i].hp += skills[enemyData[i].a].hp;
			enemyData[i].atk += skills[enemyData[i].a].atk;
			enemyData[i].spd += skills[enemyData[i].a].spd;
			enemyData[i].def += skills[enemyData[i].a].def;
			enemyData[i].res += skills[enemyData[i].a].res;
		}

		if(enemyData[i].s != -1){
			enemyData[i].hp += skills[enemyData[i].s].hp;
			enemyData[i].atk += skills[enemyData[i].s].atk;
			enemyData[i].spd += skills[enemyData[i].s].spd;
			enemyData[i].def += skills[enemyData[i].s].def;
			enemyData[i].res += skills[enemyData[i].s].res;
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
		$("#challenger_currenthp").html(challengerHp - challengerDamage);
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

		for(var i = 0; i < nextPreviousFightResults.length; i++){
			previousFightResults[i] = nextPreviousFightResults[i];
		}

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
			var sName = "noskill";
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
			if(fightResults[i].enemy.sIndex != -1){
				sName = skills[fightResults[i].enemy.sIndex].name.replace(/\s/g,"_");
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
					"<span class=\"results_stat\">HP: " + fightResults[i].enemy.maxHp + "</span><span class=\"results_stat\">Atk: " + fightResults[i].enemy.atk + "</span><span class=\"results_stat\">Spd: " + fightResults[i].enemy.spd + "</span><span class=\"results_stat\">Def: " + fightResults[i].enemy.def + "</span><span class=\"results_stat\">Res: " + fightResults[i].enemy.res + "</span><div class=\"results_skills\"><span class=\"results_stat\"><img class=\"skill_picture\" src=\"skills/weapon.png\"/>" + weaponName + "</span><span class=\"results_stat\"><img class=\"skill_picture\" src=\"skills/special.png\"/>" + specialName + "</span><span class=\"results_stat\"><img class=\"skill_picture\" src=\"skills/" + aName + ".png\"/><img class=\"skill_picture\" src=\"skills/" + bName + ".png\"/><img class=\"skill_picture\" src=\"skills/" + cName + ".png\"/><img class=\"skill_picture\" src=\"skills/" + sName + ".png\"/></span></div>",
				"</div>",
			"</div>",""].join("\n"));

			//Set next previous result after showing this result
			nextPreviousFightResults[fightResults[i].enemy.heroIndex] = "Previous result: " + resultText + ", <span class=\"blue\">" + fightResults[i].challengerHp + "</span> &ndash; <span class=\"red\">" + fightResults[i].enemyHp + "</span>";
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
	//Hide results that aren't different if view is set to changed only
	//viewFilter is 0 or 1
	var sortOrder = parseInt($("#sort_results").val());
	var outputHTML = "";

	if(sortOrder==1){
		for(var i = 0; i < resultHTML.length; i++){
			if(filterResult(i)){
				outputHTML += resultHTML[i];
			}
		}
	}
	else if(sortOrder==-1){
		for(var i = resultHTML.length-1; i >= 0; i--){
			if(filterResult(i)){
				outputHTML += resultHTML[i];
			}
		}
	}
	$("#results_list").html(outputHTML);
}

//Helper function for filtering
//Will return true if include or false if not
function filterResult(i){
	if(!viewFilter){
		return true;
	}
	else{
		if(previousFightResults[i]==""){
			return false;
		}

		var enemyIndex = fightResults[i].enemy.heroIndex;

		var prevWin = previousFightResults[enemyIndex].includes("win");
		var prevLoss = previousFightResults[enemyIndex].includes("loss");
		var prevTie = previousFightResults[enemyIndex].includes("inconclusive");
		var sameResult = false;
		if((fightResults[i].challengerHp==0 && prevLoss) || (fightResults[i].enemyHp==0 && prevWin) || (fightResults[i].challengerHp!=0 && fightResults[i].enemyHp!=0 && prevTie)){
			sameResult = true;
		}

		if(viewFilter==1){//changed victor
			return !sameResult;
		}
		else if(viewFilter==2){//changed rounds
			var extractRounds =  previousFightResults[enemyIndex].match(/([1-4]) rounds?/);
			if(extractRounds){
				if(fightResults[i].rounds == extractRounds[1] || !sameResult){
					return false;
				}
				else{
					return true;
				}
			}
			else{
				//Don't show inconclusive because it's always max rounds
				return false;
			}
		}
	}
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

function verifyNumberInput(element,min,max){
	//contrains number between two values and returns it
	var newVal = parseInt($(element).val());
	if(!newVal){
		//If input is blank, make it 0
		newVal = 0;
		$(element).val(0);
	}
	if(newVal < min){
		$(element).val(min);
		newVal = min;
	}
	else if(newVal > max){
		$(element).val(max);
		newVal = max;
	}
	return newVal;
}

function resetChallenger(){
	$("#hero_atk_buff, #hero_spd_buff, #hero_def_buff, #hero_res_buff, #hero_atk_debuff, #hero_spd_debuff, #hero_def_debuff, #hero_res_debuff, #hero_atk_spur, #hero_spd_spur, #hero_def_spur, #hero_res_spur, #challenger_precharge, #challenger_merge, #challenger_damage").val(0);
	$("#challenger_rarity").val(5);
	//Set skills to default
	challengerRarity = 5;
	setSkillOptions();
	resetChallengerSkills();

	$("#hero_boon_hp, #hero_boon_atk, #hero_boon_spd, #hero_boon_def, #hero_boon_res").attr("data-val",0).removeClass("bane").removeClass("boon").addClass("neutral").html("Neutral");

	challengerDamage = 0;
	challengerPrecharge = 0;
	challengerMerge = 0;
	challengerBuffs = {"atk":0,"spd":0,"def":0,"res":0};
	challengerDebuffs = {"atk":0,"spd":0,"def":0,"res":0};
	challengerSpur = {"atk":0,"spd":0,"def":0,"res":0};
	
	setStats();
	setUI();

	if(autoCalculate){
		calculate();
	}
}

function resetChallengerSkills(){
	if(challengerIndex != -1){
		challengerWeapon = heroMaxSkills[challengerRarity-1][challengerIndex].weapon;
		challengerSpecial = heroMaxSkills[challengerRarity-1][challengerIndex].special;
		challengerA = heroMaxSkills[challengerRarity-1][challengerIndex].a;
		challengerB = heroMaxSkills[challengerRarity-1][challengerIndex].b;
		challengerC = heroMaxSkills[challengerRarity-1][challengerIndex].c;
	}
	else{
		challengerWeapon = -1;
		challengerSpecial = -1;
		challengerA = -1;
		challengerB = -1;
		challengerC = -1;
	}
	challengerS = -1;
	

	$("#hero_weapon").val(challengerWeapon);
	$("#hero_special").val(challengerSpecial);
	$("#hero_a").val(challengerA);
	$("#hero_b").val(challengerB);
	$("#hero_c").val(challengerC);
	$("#hero_s").val(challengerS);

	changeSkillPic("a",challengerA);
	changeSkillPic("b",challengerB);
	changeSkillPic("c",challengerC);
	changeSkillPic("s",challengerS);

}

function resetEnemies(){
	$("#enemies_atk_buff, #enemies_spd_buff, #enemies_def_buff, #enemies_res_buff, #enemies_atk_debuff, #enemies_spd_debuff, #enemies_def_debuff, #enemies_res_debuff, #enemies_atk_spur, #enemies_spd_spur, #enemies_def_spur, #enemies_res_spur, #enemies_weapon_overwrite, #enemies_special_overwrite, #enemies_a_overwrite, #enemies_b_overwrite, #enemies_c_overwrite, #enemies_merge, #enemies_damage").val(0);
	$("#enemies_rarity").val(5);
	$("#enemies_weapon").val(-1);
	$("#enemies_special").val(-1);
	$("#enemies_a").val(-1);
	$("#enemies_b").val(-1);
	$("#enemies_c").val(-1);
	$("#enemies_s").val(-1);

	enemiesWeapon = -1;
	enemiesSpecial = -1;
	enemiesA = -1;
	enemiesB = -1;
	enemiesC = -1;
	enemiesS = -1;
	enemyRarity = 5;

	$("#enemies_boon_hp, #enemies_boon_atk, #enemies_boon_spd, #enemies_boon_def, #enemies_boon_res").attr("data-val",0).removeClass("bane").removeClass("boon").addClass("neutral");

	enemyDamage = 0;
	enemyPrecharge = 0;
	enemiesMerge = 0;
	enemyBuffs = {"atk":0,"spd":0,"def":0,"res":0};
	enemyDebuffs = {"atk":0,"spd":0,"def":0,"res":0};
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

function showImportDialog(side,type){
	//side = challenger or enemies, type = import or export
	var label = "";
	if(type=="import"){
		label = "Import ";
		$("#button_import").html("Import into calculator");
	}
	else{
		label = "Export ";
		$("#button_import").html("Copy to clipboard");
	}

	if(side=="challenger"){
		$("#frame_import").removeClass("enemiesimport").addClass("challengerimport");
		label += "challenger";
	}
	else if(side=="enemies"){
		$("#frame_import").removeClass("enemiesimport").addClass("enemiesimport");
		label += "enemies";
	}

	$("#import_title").html(label);
}

function hideImportDialog(){
	$("#screen_fade").hide();
	$("#frame_import").hide();
}

function exportCalc(){
	//Exports all results to csv - doesn't take filters into account
	//If people complain, I will make it take the filters into account

	if(fightResults.length>0){
		var csvString = "data:text/csv;charset=utf-8,";

		//Column headers
		//Should take out buffs and stuff that aren't used to minimize columns?
		csvString += "Challenger,cColor,cMovetype,cWeapontype,cRarity,cMerge,cBoon,cBane,cMaxHP,cStartHP,cAtk,cSpd,cDef,cRes,cWeapon,cSpecial,cPrecharge,cA,cB,cC,cS,cBuffAtk,cBuffSpd,cBuffDef,cBuffRes,cDebuffAtk,cDebuffSpd,cDebuffDef,cDebuffRes,cSpurAtk,cSpurSpd,cSpurDef,cSpurRes,";
		csvString += "Enemy,eColor,eMovetype,eWeapontype,eRarity,eMerge,eBoon,eBane,eMaxHP,eStartHP,eAtk,eSpd,eDef,eRes,eWeapon,eSpecial,ePrecharge,eA,eB,eC,eS,eBuffAtk,eBuffSpd,eBuffDef,eBuffRes,eDebuffAtk,eDebuffSpd,eDebuffDef,eDebuffRes,eSpurAtk,eSpurSpd,eSpurDef,eSpurRes,";
		csvString += "FirstTurnThreaten,StartTurn,UseGaleforce,Initiator1,Initiator2,Initiator3,Initiator4,Outcome,cEndHP,eEndHP,Rounds,BattleLog\n";

		fightResults.forEach(function(result){
			csvString += heroes[challengerIndex].name + ",";
			csvString += heroes[challengerIndex].color + ",";
			csvString += heroes[challengerIndex].movetype + ",";
			csvString += heroes[challengerIndex].weapontype + ",";
			csvString += challengerRarity + ",";
			csvString += challengerMerge + ",";
			csvString += challengerBoon + ",";
			csvString += challengerBane + ",";
			csvString += challengerHp + ",";
			csvString += Math.max(challengerHp - challengerDamage,1) + ",";
			csvString += challengerAtk + ",";
			csvString += challengerSpd + ",";
			csvString += challengerDef + ",";
			csvString += challengerRes + ",";
			if(challengerWeapon != -1){
				csvString += skills[challengerWeapon].name + ",";
			}
			else{
				csvString += ",";
			}
			if(challengerSpecial != -1){
				csvString += skills[challengerSpecial].name + ",";
			}
			else{
				csvString += ",";
			}
			csvString += challengerPrecharge + ",";
			if(challengerA != -1){
				csvString += skills[challengerA].name + ",";
			}
			else{
				csvString += ",";
			}
			if(challengerB != -1){
				csvString += skills[challengerB].name + ",";
			}
			else{
				csvString += ",";
			}
			if(challengerC != -1){
				csvString += skills[challengerC].name + ",";
			}
			else{
				csvString += ",";
			}
			if(challengerS != -1){
				csvString += skills[challengerS].name + ",";
			}
			else{
				csvString += ",";
			}
			csvString += challengerBuffs.atk + ",";
			csvString += challengerBuffs.spd + ",";
			csvString += challengerBuffs.def + ",";
			csvString += challengerBuffs.res + ",";
			csvString += challengerDebuffs.atk + ",";
			csvString += challengerDebuffs.spd + ",";
			csvString += challengerDebuffs.def + ",";
			csvString += challengerDebuffs.res + ",";
			csvString += challengerSpur.atk + ",";
			csvString += challengerSpur.spd + ",";
			csvString += challengerSpur.def + ",";
			csvString += challengerSpur.res + ",";

			var enemy = result.enemy;
			csvString += enemy.name + ",";
			csvString += enemy.color + ",";
			csvString += enemy.moveType + ",";
			csvString += enemy.weaponType + ",";
			csvString += enemy.rarity + ",";
			csvString += enemy.merge + ",";
			csvString += enemiesBoon + ",";
			csvString += enemiesBane + ",";
			csvString += enemy.maxHp + ",";
			csvString += Math.max(enemy.maxHp - enemyDamage,1) + ",";
			csvString += enemy.atk + ",";
			csvString += enemy.spd + ",";
			csvString += enemy.def + ",";
			csvString += enemy.res + ",";
			if(enemy.weaponIndex != -1){
				csvString += skills[enemy.weaponIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			if(enemy.specialIndex != -1){
				csvString += skills[enemy.specialIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			csvString += enemyPrecharge + ",";
			if(enemy.aIndex != -1){
				csvString += skills[enemy.aIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			if(enemy.bIndex != -1){
				csvString += skills[enemy.bIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			if(enemy.cIndex != -1){
				csvString += skills[enemy.cIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			if(enemy.sIndex != -1){
				csvString += skills[enemy.sIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			csvString += enemy.buffs.atk + ",";
			csvString += enemy.buffs.spd + ",";
			csvString += enemy.buffs.def + ",";
			csvString += enemy.buffs.res + ",";
			csvString += enemy.debuffs.atk + ",";
			csvString += enemy.debuffs.spd + ",";
			csvString += enemy.debuffs.def + ",";
			csvString += enemy.debuffs.res + ",";
			csvString += enemy.spur.atk + ",";
			csvString += enemy.spur.spd + ",";
			csvString += enemy.spur.def + ",";
			csvString += enemy.spur.res + ",";

			csvString += threatenRule + ",";
			csvString += startTurn + ",";
			csvString += useGaleforce + ",";
			for(var rnd = 0; rnd < 4;rnd++){
				if(!!roundInitiators[rnd]){
					csvString += roundInitiators[rnd].substring(0,roundInitiators[rnd].length-10) + ",";
				}
				else{
					csvString += ",";
				}
			}
			var outcome = "Inconclusive";
			if(result.challengerHp==0){
				outcome = "Loss";
			}
			else if(result.enemyHp==0){
				outcome = "Win";
			}
			csvString += outcome + ",";
			csvString += result.challengerHp + ",";
			csvString += result.enemyHp + ",";
			csvString += result.rounds + ",";
			var deTaggedLog = result.fightText.replace(/<br\/?>/g, "; ");
			deTaggedLog = deTaggedLog.replace(/<\/?[^>]+(>|$)/g, "");
			csvString += "\"" + deTaggedLog + "\"";

			csvString += "\n";
		});

		var encodedUri = encodeURI(csvString);
		var fakeLink = document.createElement("a");
		fakeLink.setAttribute("href", encodedUri);
		var date = new Date();
		fakeLink.setAttribute("download", "feh_simulator_" + (date.getYear()+1900) + "-" + date.getMonth() + "-" + date.getDate() + ".csv");
		document.body.appendChild(fakeLink);
		fakeLink.click();
	}
	else{
		alert("No results!");
	}
}