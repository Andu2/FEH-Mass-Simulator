//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//Initialize variables and data structure

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

var debug = false;

data.weaponTypes = ["sword","lance","axe","redtome","bluetome","greentome","dragon","bow","dagger","staff"];
data.rangedWeapons = ["redtome","bluetome","greentome","bow","dagger","staff"];
data.meleeWeapons = ["sword","lance","axe","dragon"];
data.physicalWeapons = ["sword","lance","axe","bow","dagger"];
data.magicalWeapons = ["redtome","bluetome","greentome","dragon","staff"];
data.moveTypes = ["infantry","armored","flying","cavalry"];
data.colors = ["red","blue","green","gray"];
data.skillSlots = ["weapon","special","a","b","c","s"];
data.buffTypes = ["buffs","debuffs","spur"];
data.buffStats = ["atk","spd","def","res"];
data.stats = ["hp","atk","spd","def","res"];

//Growth shifts of 3 are what make some banes/boons +/- 4
//growth table from https://feheroes.wiki/Stat_Growth
data.growths = [[6,8,9,11,13,14,16,18,19,21,23,24],
[7,8,10,12,14,15,17,19,21,23,25,26],
[7,9,11,13,15,17,19,21,23,25,27,29],
[8,10,12,14,16,18,20,22,24,26,28,31],
[8,10,13,15,17,19,22,24,26,28,30,33]];

//Remember: heroes, skills, prereqs, and heroskills arrays come from PHP-created script

//Sort hero array by name
data.heroes.sort(function(a,b){
	//console.log(a.name + ", " + b.name + ": " + a.name>b.name);
	return (a.name.toLowerCase() > b.name.toLowerCase())*2-1;
})

//Sort skills array by name
data.skills.sort(function(a,b){
	//console.log(a.name + ", " + b.name + ": " + a.name>b.name);
	return (a.name.toLowerCase() + a.slot > b.name.toLowerCase() + b.slot)*2-1;
})

data.heroPossibleSkills = [];
data.heroBaseSkills = [];
data.heroMaxSkills = [[],[],[],[],[]]; //2d array; 1st num rarity, 2nd num skillindex

data.skillsThatArePrereq = [];
//Prereq exceptions are Sol, Luna, Astra, Assault
data.skillPrereqExceptions = [125,162,168,170];

data.enemyPrompts = {
	//Just for fun, special messages for some of my favorites ;)
	"default":"Enemies to fight:",
	"Effie":"Who to crush:",
	"Karel":"Time to feast:",
	"Nino":"Do my best:",
	"Sharena":"My turn!:"
}

function initOptions(){
	//Initializes options from localStorage or from scratch

	//Holder for options that aren't hero-specific
	options = {};
	options.autoCalculate = true;
	options.startTurn = 0;
	options.useGaleforce = true;
	options.threatenRule = "Neither";
	options.ployBehavior = "Diagonal";
	options.showOnlyMaxSkills = true;
	options.hideUnaffectingSkills = true;
	options.viewFilter = "all";
	options.customEnemyList = 0;
	options.customEnemySelected = -1;
	options.sortOrder = 1;
	options.roundInitiators = ["Challenger initiates","Enemy initiates"];

	//Holder for challenger options and pre-calculated stats
	challenger = new Hero({
		challenger: true
	});

	//Holder for enemy options and pre-calculated stats
	enemies = {};
	enemies.fl = {}; //Full list
	enemies.fl.isFl = true;
	enemies.fl.list = []; //May not actually use - might be too much redundant data

	enemies.fl.include = {"melee":1,"ranged":1,"red":1,"blue":1,"green":1,"gray":1,"physical":1,"magical":1,"infantry":1,"cavalry":1,"flying":1,"armored":1,"staff":0,"nonstaff":1};

	enemies.fl.merge = 0;
	enemies.fl.rarity = 5;
	enemies.fl.boon = "none";
	enemies.fl.bane = "none";

	enemies.fl.naturalSkills = [];
	enemies.fl.validWeaponSkills = getValidSkills(enemies.fl,"weapon");
	enemies.fl.validSpecialSkills = getValidSkills(enemies.fl,"special");
	enemies.fl.validASkills = getValidSkills(enemies.fl,"a");
	enemies.fl.validBSkills = getValidSkills(enemies.fl,"b");
	enemies.fl.validCSkills = getValidSkills(enemies.fl,"c");
	enemies.fl.validSSkills = getValidSkills(enemies.fl,"s");

	enemies.fl.avgHp = 0;
	enemies.fl.avgAtk = 0;
	enemies.fl.avgSpd = 0;
	enemies.fl.avgDef = 0;
	enemies.fl.avgRes = 0;

	enemies.fl.weapon = -1;
	enemies.fl.special = -1;
	enemies.fl.a = -1;
	enemies.fl.b = -1;
	enemies.fl.c = -1;
	enemies.fl.s = -1;
	enemies.fl.replaceWeapon = 0;
	enemies.fl.replaceSpecial = 0;
	enemies.fl.replaceA = 0;
	enemies.fl.replaceB = 0;
	enemies.fl.replaceC = 0;

	enemies.fl.buffs = getBlankBuffStats();
	enemies.fl.debuffs = getBlankBuffStats();
	enemies.fl.spur = getBlankBuffStats();

	enemies.fl.damage = 0;
	enemies.fl.precharge = 0;

	enemies.cl = {}; //Custom list
	enemies.cl.list = [];

	enemies.cl.avgHp = 0;
	enemies.cl.avgAtk = 0;
	enemies.cl.avgSpd = 0;
	enemies.cl.avgDef = 0;
	enemies.cl.avgRes = 0;

	// //now set stored values
	// //(setting and resetting just in case new options are defined)
	// var storedOptions = JSON.parse(localStorage.getItem("options"));
	// var storedChallenger = JSON.parse(localStorage.getItem("challenger"));
	// var storedEnemies = JSON.parse(localStorage.getItem("enemies"));

	// replaceRecursive(options,storedOptions);
	// replaceRecursive(challenger,storedChallenger);
	// replaceRecursive(enemies,storedEnemies);

	if(options.customEnemySelected >= enemies.cl.list.length){
		options.customEnemySelected = enemies.cl.list.length - 1;
	}
}

initOptions();

var battles = [];
var resultHTML = [];

var showingTooltip = false;
var calcuwaiting = false;
var calcuwaitTime = 0;

//Make list of all skill ids that are a strictly inferior prereq to exclude from dropdown boxes
for(var i = 0; i < data.prereqs.length;i++){
	if(data.skillsThatArePrereq.indexOf(data.prereqs[i].required_id)==-1 && data.skillPrereqExceptions.indexOf(data.prereqs[i].required_id)==-1){
		data.skillsThatArePrereq.push(data.prereqs[i].required_id);
	}
}

//Find hero skills
for(var i = 0; i < data.heroes.length;i++){
	data.heroPossibleSkills.push(getValidSkills({index:i}));

	var baseSkills = getHeroSkills(i);
	data.heroBaseSkills.push(baseSkills);
	for(var j = 0; j < 5; j++){
		data.heroMaxSkills[j].push(getMaxSkills(baseSkills,j));
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//Put DOM stuff in place

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

$(document).ready(function(){

	//Show incompatibility message: code does not work fr IE<9
	//(Analytics show that the % of people who use IE<9 on my site is EXTREMELY low, like 1 in 30,000)
	if(![].forEach){
		console.log("Unsupported JavaScript");
		$("#update_text").html("Your browser does not appear to support some of the code this app uses (JavaScript ES5). The app probably won't work.");
	}
	
	//Populate hero select options
	var heroHTML = "<option value=-1 class=\"hero_option\">Select Hero</option>";
	for(var i = 0; i < data.heroes.length; i++){
		heroHTML += "<option value=" + i + " class=\"hero_option\">" + data.heroes[i].name + "</option>";
	}

	var enemyHTML = heroHTML + "<option value=-2 class=\"hero_option\">Custom</option>";
	$("#challenger_name").html(heroHTML).select2();
	$("#cl_enemy_name").html(enemyHTML).select2();

	setSkillOptions(enemies.fl);
	
	initEnemyList();

	updateFullUI();

	//Create listener on whole body and check data-var to see which var to replace
	//TODO: make click listeners work similarly
	$("input, select").on("change", function(e){
		var dataVar = $(this).attr("data-var");
		if(dataVar){
			var varsThatChangeStats = [
				".rarity",".merge",".boon",".bane",".weapon",".a",".s",".replaceWeapon",".replaceA"
			];
			var varsThatChangeSkills = [
				".rarity",".replaceWeapon",".replaceSpecial",".replaceA",".replaceB",".replaceC","enemies.fl.weapon",
				"enemies.fl.special","enemies.fl.a","enemies.fl.b","enemies.fl.c","enemies.fl.s"
			];
			var varsThatUpdateFl = [
				".boon",".bane",".precharge",".damage",".rarity",".merge"
			]

			var newVal = $(this).val();
			var useCalcuwait = false;
			var blockCalculate = false;

			var hero;
			if(beginsWith(dataVar,"challenger.")){
				hero = challenger;
			}
			else if(beginsWith(dataVar,"enemies.fl")){
				hero = enemies.fl;
			}
			else if(beginsWith(dataVar,"enemies.cl.list")){
				if(options.customEnemySelected == -1){
					addClEnemy();
				}
				hero = enemies.cl.list[options.customEnemySelected];
			}

			var inputType = $(this).attr("type");
			if(inputType=="number"){
				var min = $(this).attr("min");
				var max = $(this).attr("max");
				useCalcuwait = true;
				if(typeof min != "undefined" && typeof max != "undefined"){
					newVal = verifyNumberInput(this,min,max);
				}
				else{
					newVal = parseInt(newVal);
				}
			}
			else if(inputType=="checkbox"){
				newVal = $(this).is(":checked");
			}

			if(endsWith(dataVar,".customWeapon")){
				//Get color
				changeDataVar("enemies.cl.list.customColor",getColorFromWeapon(newVal));
				if(endsWith(newVal,"dragon")){
					newVal = "dragon";
				}
			}

			//Change val to numeric if it looks numeric
			//All numbers used by this program are ints
			if($.isNumeric(newVal)){
				newVal = parseInt(newVal);
			}

			changeDataVar(dataVar,newVal);

			//Stuff specific to changing skill
			if(newVal != -1 && (endsWith(dataVar,".weapon") || endsWith(dataVar,".special") || endsWith(dataVar,".a") || endsWith(dataVar,".b") || endsWith(dataVar,".c") || endsWith(dataVar,".s"))){

				var dataToPass = data.skills[newVal].name;
				if(endsWith(dataVar,".s")){
					//Rename s skills to differentate from regular skills
					dataToPass = "s_" + dataToPass;
				}
				if(hero.challenger){
					dataLayer.push({"event":"changeSkill","skill_name":dataToPass});
				}
				else{
					dataLayer.push({"event":"changeEnemySkill","skill_name":dataToPass});
				}
			}

			//Stuff specific to changing hero
			if(endsWith(dataVar,".index")){
				if(newVal != -1){

					//find hero's starting skills
					initHero(hero);

					var name = "error";
					if(newVal == -2){
						name = "Custom";
					}
					else{
						name = data.heroes[newVal].name;
					}

					if(hero.challenger){

						//Analytics
						dataLayer.push({"event":"changeHero","challenger_name":name});
					}
					else{
						updateClList();

						//Analytics
						dataLayer.push({"event":"changeEnemy","challenger_name":name});
					}
				}
			}
			else if(endsWith(dataVar,".showOnlyMaxSkills") || endsWith(dataVar,".hideUnaffectingSkills")){
				blockCalculate = true;
				updateChallengerUI();
				updateEnemyUI();
				//Not hero so won't automatically update uis
			}
			else if(endsWith(dataVar,".viewFilter") || endsWith(dataVar,".sortOrder")){
				blockCalculate = true;
			}
			else if(endsWith(dataVar,".autoCalculate")){
				if(newVal == 0){
					blockCalculate = true;
				}
			}

			for(var i = 0; i < varsThatUpdateFl.length; i++){
				if(endsWith(dataVar,varsThatUpdateFl[i])){
					updateFlEnemies();
					break;
				}
			}

			for(var i = 0; i < varsThatChangeSkills.length; i++){
				if(endsWith(dataVar,varsThatChangeSkills[i])){
					setSkills(hero);
					break;
				}
			}

			for(var i = 0; i < varsThatChangeStats.length; i++){
				if(endsWith(dataVar,varsThatChangeStats[i])){
					setStats(hero);
					break;
				}
			}

			if(hero && hero.challenger){
				updateChallengerUI();
			}
			else if(typeof hero != "undefined"){
				updateEnemyUI();
			}

			if(!blockCalculate){
				if(useCalcuwait){
					calcuWait(300);
				}
				else{
					calculate();
				}
			}
			else{
				outputResults()
			}
		}

		//Don't check parent elements
		e.stopPropagation();
	});

	$(".wideincludebutton, .thinincludebutton").click(function(){
		var includeRule = this.id.substring(8);
		if(enemies.fl.include[includeRule]){
			enemies.fl.include[includeRule] = 0;
			$(this).removeClass("included");
			$(this).addClass("notincluded");
		}
		else{
			enemies.fl.include[includeRule] = 1;
			$(this).removeClass("notincluded");
			$(this).addClass("included");
		}
		initEnemyList();
		updateEnemyUI()
		calculate();
	});

	$("#add_turn_challenger").click(function(){
		addTurn("Challenger initiates");
	})
	$("#add_turn_enemy").click(function(){
		addTurn("Enemy initiates");
	})

	$(".button_importexport").click(function(){
		var target = "challenger";
		var type = "import";
		if(this.id.indexOf("enemies") != -1){
			target = "enemies";
		}
		if(this.id.indexOf("export") != -1){
			type = "export";
		}
		showImportDialog(target,type);
	})

	$("#import_exit").click(function(){
		hideImportDialog();
	})

	$("#enemies_mode").change(function(){
		switchEnemySelect($(this).val());
	})

	$("#reset_challenger").click(function(){
		resetHero(challenger);
	})

	$("#reset_enemies").click(function(){
		resetHero(enemies.fl);
	})

	$("#reset_cl_enemy").click(function(){
		if(enemies.cl.list[options.customEnemySelected]){
			resetHero(enemies.cl.list[options.customEnemySelected]);
		}
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

	// $(window).unload(function(){
	// 	//store options
	// 	localStorage.setItem("options",JSON.stringify(options));
	// 	localStorage.setItem("challenger",JSON.stringify(challenger));
	// 	localStorage.setItem("enemies",JSON.stringify(enemies));
	// })

	//Show update notice if hasn't been show for this localStorage
	doUpdateNotice();
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//Data manipulating helper functions

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

function initHero(hero,alreadyHasSkills){
	if(hero.index != -1){
		if(hero.index == -2){ //custom enemy
			hero.naturalSkills = [];
		}
		else{
			hero.naturalSkills = data.heroBaseSkills[hero.index];
		}

		hero.validWeaponSkills = getValidSkills(hero,"weapon");
		hero.validSpecialSkills = getValidSkills(hero,"special");
		hero.validASkills = getValidSkills(hero,"a");
		hero.validBSkills = getValidSkills(hero,"b");
		hero.validCSkills = getValidSkills(hero,"c");
		hero.validSSkills = getValidSkills(hero,"s");
		if(!alreadyHasSkills){
			setSkills(hero);
		}
		else{
			//validate that the skills it already has are okay
			if(!hero.rarity){
				hero.rarity = 5;
			}
			data.skillSlots.forEach(function(slot){
				if(hero["valid" + capitalize(slot) + "Skills"].indexOf(hero[slot]) == -1){
					hero[slot] = -1;
				}
			});
		}
		setSkillOptions(hero);
		hero.setStats();
	}
}

function initEnemyList(){
	setFlEnemies();
	setSkills(enemies.fl);
	setStats(enemies.fl);
}

function getValidSkills(hero,slot){
	//returns an array of indices on "skills" array for skills that hero can learn
	//If hero has no index, returns all skills in slot except unique
	//if not given slot, gives all

	var validSkills = [];
	for(var i = 0; i < data.skills.length; i++){
		var inheritRules = data.skills[i].inheritrule.split(","); //Thanks Galeforce (melee,physical)
		if(!slot || data.skills[i].slot == slot){
			if(hero.index != undefined){

				var weaponType = "none";
				var moveType = "none";
				var color = "none";

				if(hero.index >= 0){
					weaponType = data.heroes[hero.index].weapontype;
					moveType = data.heroes[hero.index].movetype;
				}
				else if(hero.index == -2){
					weaponType = hero.customWeapon;
					moveType = hero.customMove;
					color = hero.customColor;
				}

				var attackType = getAttackTypeFromWeapon(data.heroes[hero.index].weapontype);
				var inheritRuleMatches = 0;

				for(var ruleNum = 0; ruleNum < inheritRules.length; ruleNum++){
					//console.log("Trying " + slot + ": " + data.skills[i].name);
					if(inheritRules[ruleNum] == "unique"){
						//can only use if hero starts with it
						if(hero.naturalSkills){
							for(var j = 0; j < hero.naturalSkills.length; j++){
								if(hero.naturalSkills[j][0] == data.skills[i].skill_id){
									inheritRuleMatches++;
								}
							}
						}
					}
					else if(attackType == inheritRules[ruleNum]){
						//inherit if weapon is right attacking type
						inheritRuleMatches++;
					}
					else if(data.weaponTypes.indexOf(inheritRules[ruleNum])!=-1){
						//inherit if weapon is right
						if(weaponType==inheritRules[ruleNum]){
							inheritRuleMatches++;
						}
					}
					else if(data.moveTypes.indexOf(inheritRules[ruleNum])!=-1){
						//inherit if movetype is right
						if(moveType==inheritRules[ruleNum]){
							inheritRuleMatches++;
						}
					}
					else if(data.weaponTypes.indexOf(inheritRules[ruleNum].replace("non",""))!=-1){
						//inherit if not a certain weapon
						if(weaponType!=inheritRules[ruleNum].replace("non","")){
							inheritRuleMatches++;
						}
					}
					else if(data.moveTypes.indexOf(inheritRules[ruleNum].replace("non",""))!=-1){
						//inherit if not a certain movement type
						if(moveType!=inheritRules[ruleNum].replace("non","")){
							inheritRuleMatches++;
						}
					}
					else if(data.colors.indexOf(inheritRules[ruleNum].replace("non",""))!=-1){
						//inherit if not a certain color
						if(color!=inheritRules[ruleNum].replace("non","")){
							inheritRuleMatches++;
						}
					}
					else if(inheritRules[ruleNum]=="ranged"){
						//inherit if weapon type in ranged group
						if(data.rangedWeapons.indexOf(weaponType) != -1){
							inheritRuleMatches++;
						}
					}
					else if(inheritRules[ruleNum]=="melee"){
						//inherit if weapon type in melee group
						if(data.meleeWeapons.indexOf(weaponType) != -1){
							inheritRuleMatches++;
						}
					}
					else if(inheritRules[ruleNum]==""){
						//everyone can inherit!
						inheritRuleMatches++;
					}
					else{
						//shouldn't get here
						//console.log("Issue finding logic for inheritrule " + inheritRules[ruleNum]);
					}

					if(inheritRuleMatches == inheritRules.length){
						validSkills.push(i);
					}
				}
			}
			else{
				//It's the right slot, not given hero.index, so it's valid unless unique
				if(inheritRules[0] != "unique"){
					validSkills.push(i);
				}
			}
		}
	}
	return validSkills;	
}

function getHeroSkills(heroIndex){
	//returns an array of arrays of skill-rarity pairs
	var skillset = [];
	for(var i = 0; i < data.heroSkills.length;i++){
		if(data.heroSkills[i].hero_id==data.heroes[heroIndex].hero_id){
			var skillPair = [data.heroSkills[i].skill_id,data.heroSkills[i].rarity];
			skillset.push(skillPair);
		}
	}
	return skillset;
}

function getMaxSkills(skillset,rarity){
	//Finds max skills based on rarity
	//Gets one with highest sp cost
	var maxSkillset = {"weapon":-1,"special":-1,"a":-1,"b":-1,"c":-1};
	for(var i = 0; i < skillset.length;i++){
		var skillIndex = getSkillIndexFromId(skillset[i][0]);
		var skill = data.skills[skillIndex];
		if((skill.slot != "s" && skill.slot != "assist") && skillset[i][1] <= rarity + 1){
			if(maxSkillset[skill.slot]==-1){
				maxSkillset[skill.slot] = skillIndex;
			}
			else{
				if(data.skills[maxSkillset[skill.slot]].sp < skill.sp){
					maxSkillset[skill.slot] = skillIndex;
				}
			}
		}
	}
	return maxSkillset;
}

function setStats(hero){
	if(hero.isFl){
		enemies.fl.avgHp = 0;
		enemies.fl.avgAtk = 0;
		enemies.fl.avgSpd = 0;
		enemies.fl.avgDef = 0;
		enemies.fl.avgRes = 0;

		var numIncluded = 0;

		for(var i = 0; i < enemies.fl.list.length;i++){
			if(enemies.fl.list[i].included){
				setStats(enemies.fl.list[i]);

				enemies.fl.avgHp += enemies.fl.list[i].hp;
				enemies.fl.avgAtk += enemies.fl.list[i].atk;
				enemies.fl.avgSpd += enemies.fl.list[i].spd;
				enemies.fl.avgDef += enemies.fl.list[i].def;
				enemies.fl.avgRes += enemies.fl.list[i].res;

				numIncluded++;
			}
		}
		if(numIncluded > 0){
			enemies.fl.avgHp = Math.round(enemies.fl.avgHp/numIncluded);
			enemies.fl.avgAtk = Math.round(enemies.fl.avgAtk/numIncluded);
			enemies.fl.avgSpd = Math.round(enemies.fl.avgSpd/numIncluded);
			enemies.fl.avgDef = Math.round(enemies.fl.avgDef/numIncluded);
			enemies.fl.avgRes = Math.round(enemies.fl.avgRes/numIncluded);
		}
	}
	else if(typeof hero.index != "undefined" && hero.index == -2){
		hero.hp = hero.customhp;
		hero.atk = hero.customatk;
		hero.spd = hero.customspd;
		hero.def = hero.customdef;
		hero.res = hero.customres;
	}
}

function setSkills(hero){
	if(hero.isFl){
		for(var i = 0; i < enemies.fl.list.length;i++){
			//Set default skills
			setSkills(enemies.fl.list[i]);

			//Find if skill needs replacement based on inputs
			data.skillSlots.forEach(function(slot){
				if(enemies.fl[slot] != -1 && (enemies.fl["replace" + capitalize(slot)] == 1 || enemies.fl.list[i][slot] == -1)){
					if(data.heroPossibleSkills[enemies.fl.list[i].index].indexOf(enemies.fl[slot]) != -1){
						enemies.fl.list[i][slot] = enemies.fl[slot];
					}
				}
			});
		}
	}
	else if(typeof hero.index != "undefined" && hero.index != -1){
		if(hero.index == -2){
			hero.weapon = -1;
			hero.special = -1;
			hero.a = -1;
			hero.b = -1;
			hero.c = -1;
		}
		else{
			hero.weapon = data.heroMaxSkills[hero.rarity-1][hero.index].weapon;
			hero.special = data.heroMaxSkills[hero.rarity-1][hero.index].special;
			hero.a = data.heroMaxSkills[hero.rarity-1][hero.index].a;
			hero.b = data.heroMaxSkills[hero.rarity-1][hero.index].b;
			hero.c = data.heroMaxSkills[hero.rarity-1][hero.index].c;
		}
		hero.s = -1;
	}	
}

function resetHero(hero,blockInit){//also resets fl, despite singular name - pass enemies.fl
	hero.rarity = 5;
	hero.merge = 0;
	hero.boon = "none";
	hero.bane = "none";

	hero.damage = 0;
	hero.precharge = 0;
	hero.buffs = getBlankBuffStats();
	hero.debuffs = getBlankBuffStats();
	hero.spur = getBlankBuffStats();
	
	if(hero.index){
		setSkills(hero);
		setStats(hero);
	}

	if(hero.challenger){
		updateChallengerUI();
	}
	else{
		if(options.customEnemyList == 0){
			hero.weapon = -1;
			hero.special = -1;
			hero.a = -1;
			hero.b = -1;
			hero.c = -1;
			hero.s = -1;
			hero.replaceWeapon = 0;
			hero.replaceSpecial = 0;
			hero.replaceA = 0;
			hero.replaceB = 0;
			hero.replaceC = 0;
			hero.replaceS = 0;

			hero.include = {"melee":1,"ranged":1,"red":1,"blue":1,"green":1,"gray":1,"physical":1,"magical":1,"infantry":1,"cavalry":1,"flying":1,"armored":1,"staff":0,"nonstaff":1};

			if(!blockInit){
				initEnemyList();
			}
		}

		updateEnemyUI();
	}

	calculate();
}

function addClEnemy(hIndex){
	if(!hIndex){
		hIndex = -1;
	}

	var newCustomEnemyId = enemies.cl.list.length;

	enemies.cl.list.push(new Hero(hIndex));

	options.customEnemySelected = newCustomEnemyId;
	updateEnemyUI();
	updateClList();
}

function selectClEnemy(clEnemyId){
	//this gets called when deleteClEnemy is called because the delete button is inside the select button
	if(clEnemyId < enemies.cl.list.length){
		options.customEnemySelected = clEnemyId;
		updateClList();
		updateEnemyUI();
	}
}

function deleteClEnemy(event,clEnemyId){
	//Don't fuck with renaming ids, just move the text around and hide the highest id
	enemies.cl.list.splice(clEnemyId,1);
	if(options.customEnemySelected >= enemies.cl.list.length){
		options.customEnemySelected -= 1;
	}
	updateEnemyUI();
	updateClList();
	event.stopPropagation();
}

function removeAllClEnemies(){
	enemies.cl.list = [];
	options.customEnemySelected = -1;
	updateClList();
	updateEnemyUI();
	calculate();
}

function setFlEnemies(){
	//sets enemies based on includerules
	//also updates enemy count display
	//Must be run before setStats(enemies.fl) or setSkills(enemies.fl);
	var includeCount = 0;

	for(var i = 0; i < data.heroes.length;i++){
		if(enemies.fl.list.length-1 < i){
			enemies.fl.list.push(new Hero({"index":i,"hp":0,"atk":0,"spd":0,"def":0,"res":0,"weapon":-1,"special":-1,"a":-1,"b":-1,"c":-1,"s":-1,
				"buffs": enemies.fl.buffs, "debuffs": enemies.fl.debuffs, "spur": enemies.fl.spur, "boon": enemies.fl.boon, "bane": enemies.fl.bane,
				"merge": enemies.fl.merge, "rarity": enemies.fl.rarity, "precharge": enemies.fl.precharge, "damage": enemies.fl.damage
			}));
		}

		var confirmed = true;
		//check color
		if(!enemies.fl.include[data.heroes[i].color]){
			confirmed = false;
		}
		//check move type
		else if(!enemies.fl.include[data.heroes[i].movetype]){		
			confirmed = false;
		}
		//check weapon range
		else if(!enemies.fl.include["melee"] && data.meleeWeapons.indexOf(data.heroes[i].weapontype)>=0){
			confirmed = false;
		}
		else if(!enemies.fl.include["ranged"] && data.rangedWeapons.indexOf(data.heroes[i].weapontype)>=0){
			confirmed = false;
		}
		//check weapon attack type
		else if(!enemies.fl.include["physical"] && data.physicalWeapons.indexOf(data.heroes[i].weapontype)>=0){
			confirmed = false;
		}
		else if(!enemies.fl.include["magical"] && data.magicalWeapons.indexOf(data.heroes[i].weapontype)>=0){
			confirmed = false;
		}
		else if(!enemies.fl.include["staff"] && data.heroes[i].weapontype == "staff"){
			confirmed = false;
		}
		else if(!enemies.fl.include["nonstaff"] && data.heroes[i].weapontype != "staff"){
			confirmed = false;
		}
		if(confirmed){
			enemies.fl.list[i].included = true;
			includeCount++;
		}
		else{
			enemies.fl.list[i].included = false;
		}
	}
	$("#enemies_count").html(includeCount);
}

function updateFlEnemies(){
	//Updates stuff that's not stats or skills
	for(var i = 0; i < enemies.fl.list.length; i++){
		enemies.fl.list[i].buffs =  enemies.fl.buffs;
		enemies.fl.list[i].debuffs =  enemies.fl.debuffs;
		enemies.fl.list[i].spur =  enemies.fl.spur;
		enemies.fl.list[i].boon =  enemies.fl.boon;
		enemies.fl.list[i].bane =  enemies.fl.bane;
		enemies.fl.list[i].merge =  enemies.fl.merge;
		enemies.fl.list[i].rarity =  enemies.fl.rarity;
		enemies.fl.list[i].precharge =  enemies.fl.precharge;
		enemies.fl.list[i].damage =  enemies.fl.damage;
	}
	setSkills(enemies.fl);
	setStats(enemies.fl);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//UI Functions (mostly)

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

function changeSkillPic(hero,slot){
	var htmlPrefix = getHtmlPrefix(hero);
	if(data.skills[hero[slot]]){
		var skillname = data.skills[hero[slot]].name;
		skillname = skillname.replace(/\s/g,"_");
		$("#" + htmlPrefix + slot + "_picture").attr("src","skills/" + skillname + ".png");
	}
	else{
		$("#" + htmlPrefix + slot + "_picture").attr("src","skills/noskill.png");
	}
}

function setSkillOptions(hero){
	//set html for character skill select based on valid skills

	var htmlPrefix = "challenger_";
	var maxSkills = {"weapon":-1,"special":-1,"a":-1,"b":-1,"c":-1,"s":-1};
	if(typeof hero.index != "undefined" && hero.index >= 0){
		maxSkills = data.heroMaxSkills[hero.rarity-1][hero.index];
	}

	if(!hero.challenger){
		if(hero.isFl){
			htmlPrefix = "enemies_";
		}
		else{
			htmlPrefix = "cl_enemy_";
		}
	}

	data.skillSlots.forEach(function(slot){
		var slotFriendlyText = slot;
		if(slot.length==1){
			//rename passives for display
			slotFriendlyText = slot.toUpperCase() + " passive";
		}
		var slotHTML = "<option value=-1>No " + slotFriendlyText + "</option>";
		var validSkills = hero["valid" + capitalize(slot) + "Skills"];
		if(validSkills){
			for(var i = 0; i < validSkills.length; i++){
				if(((!options.showOnlyMaxSkills || data.skillsThatArePrereq.indexOf(data.skills[validSkills[i]].skill_id)==-1) && (!options.hideUnaffectingSkills || data.skills[validSkills[i]].affectsduel)) || validSkills[i] == maxSkills[slot] || validSkills[i] == hero[slot]){
					slotHTML += "<option value=" + validSkills[i] + ">" + data.skills[validSkills[i]].name + "</option>";
				}
			}
		}
		$("#" + htmlPrefix + slot).html(slotHTML);
	});
}

function updateFullUI(){
	//Refreshes everything about the UI - try to use more specific functions if possible
	updateChallengerUI();
	updateEnemyUI();
}

function updateChallengerUI(){
	updateHeroUI(challenger);
}

function updateEnemyUI(){
	$("#enemies_mode").val(options.customEnemyList);
	switchEnemySelect(options.customEnemyList);

	if(options.customEnemyList == 1){
		updateHeroUI(enemies.cl.list[options.customEnemySelected]);
		updateClList();
	}
	else{
		updateHeroUI(enemies.fl);
	}
}

function updateHeroUI(hero){
	//Shared elements between challenger and custom enemy

	if(!hero){
		//Make a dummy hero
		hero = new Hero();
	}
	var htmlPrefix = getHtmlPrefix(hero);
	
	//Global stuff
	$("#" + htmlPrefix + "damage").val(hero.damage);
	$("#" + htmlPrefix + "precharge").val(hero.precharge);

	$("#" + htmlPrefix + "merge").val(hero.merge);
	$("#" + htmlPrefix + "rarity").val(hero.rarity);

	setSkillOptions(hero);
	$("#" + htmlPrefix + "weapon").val(hero.weapon);
	$("#" + htmlPrefix + "special").val(hero.special);
	$("#" + htmlPrefix + "a").val(hero.a);
	$("#" + htmlPrefix + "b").val(hero.b);
	$("#" + htmlPrefix + "c").val(hero.c);
	$("#" + htmlPrefix + "s").val(hero.s);
	changeSkillPic(hero,"a");
	changeSkillPic(hero,"b");
	changeSkillPic(hero,"c");
	changeSkillPic(hero,"s");

	if(hero.buffs){
		$("#" + htmlPrefix + "atk_buff").val(hero.buffs.atk);
		$("#" + htmlPrefix + "spd_buff").val(hero.buffs.spd);
		$("#" + htmlPrefix + "def_buff").val(hero.buffs.def);
		$("#" + htmlPrefix + "res_buff").val(hero.buffs.res);
		$("#" + htmlPrefix + "atk_debuff").val(hero.debuffs.atk);
		$("#" + htmlPrefix + "spd_debuff").val(hero.debuffs.spd);
		$("#" + htmlPrefix + "def_debuff").val(hero.debuffs.def);
		$("#" + htmlPrefix + "res_debuff").val(hero.debuffs.res);
		$("#" + htmlPrefix + "atk_spur").val(hero.spur.atk);
		$("#" + htmlPrefix + "spd_spur").val(hero.spur.spd);
		$("#" + htmlPrefix + "def_spur").val(hero.spur.def);
		$("#" + htmlPrefix + "res_spur").val(hero.spur.res);
	}

	$("#" + htmlPrefix + "boon").val(hero.boon);
	$("#" + htmlPrefix + "bane").val(hero.bane);

	if(typeof hero.index != "undefined" && hero.index != -1){ //cl/challenger-specific stuff
		var name = "error";
		var weaponType = "error";
		var color = "error";
		if(hero.index == -2){
			$("#enemies_custom_list .customstatinput").show();
			$("#enemies_custom_list .customattribute").show();
			$("#enemies_custom_list .stat_number").hide();
			$("#enemies_custom_list .hero_picture").hide();
			name = "Custom";
			weaponType = hero.customWeapon;
			color = hero.customColor;
		}
		else{
			$("#enemies_custom_list .customstatinput").hide();
			$("#enemies_custom_list .customattribute").hide();
			$("#enemies_custom_list .stat_number").show();
			$("#enemies_custom_list .hero_picture").show();
			name = data.heroes[hero.index].name;
			weaponType = data.heroes[hero.index].weapontype;
			color = data.heroes[hero.index].color;
		}
		$("#" + htmlPrefix + "name").val(hero.index);
		$("#" + htmlPrefix + "picture").attr("src","heroes/" + name + ".png");
		$("#" + htmlPrefix + "hp").html(hero.hp);
		$("#" + htmlPrefix + "currenthp").html(hero.hp - hero.damage);
		$("#" + htmlPrefix + "atk").html(hero.atk);
		$("#" + htmlPrefix + "spd").html(hero.spd);
		$("#" + htmlPrefix + "def").html(hero.def);
		$("#" + htmlPrefix + "res").html(hero.res);
		if(weaponType != "dragon"){
			$("#" + htmlPrefix + "weapon_icon").attr("src","weapons/" + weaponType + ".png");
		}
		else{
			$("#" + htmlPrefix + "weapon_icon").attr("src","weapons/" + color + "dragon.png");
		}

		if(hero.special != -1){
			var specialCharge = data.skills[hero.special].charge;
			if(hero.weapon != -1){
				var weaponName = data.skills[hero.weapon].name;
				if(weaponName.indexOf("Killer") != -1 || weaponName.indexOf("Killing") != -1 || weaponName.indexOf("Mystletainn") != -1 || weaponName.indexOf("Hauteclere") != -1){
					specialCharge -= 1;
				}
				else if(weaponName.indexOf("Raudrblade") != -1 || weaponName.indexOf("Lightning Breath") != -1 || weaponName.indexOf("Blarblade") != -1 || weaponName.indexOf("Gronnblade") != -1){
					specialCharge += 1;
				}
			}
			if(hero.s != -1){
				var sName = data.skills[hero.s].name;
				if(sName.indexOf("Quickened Pulse") != -1){
					specialCharge -= 1;
				}
			}

			specialCharge -= hero.precharge;
			specialCharge = Math.max(0,specialCharge);

			$("#" + htmlPrefix + "specialcharge").html(specialCharge);
		}
		else{
			$("#" + htmlPrefix + "specialcharge").html("-");
		}
	}
	else{
		if(hero.isFl){
			//Do fl-specific stuff here (no heroIndex)
			$("#" + htmlPrefix + "weapon_overwrite").val(hero.replaceWeapon);
			$("#" + htmlPrefix + "special_overwrite").val(hero.replaceSpecial);
			$("#" + htmlPrefix + "a_overwrite").val(hero.replaceA);
			$("#" + htmlPrefix + "b_overwrite").val(hero.replaceB);
			$("#" + htmlPrefix + "c_overwrite").val(hero.replaceC);

			if(enemies.fl.list.length > 0){
				$("#" + htmlPrefix + "hp").html(enemies.fl.avgHp);
				$("#" + htmlPrefix + "atk").html(enemies.fl.avgAtk);
				$("#" + htmlPrefix + "spd").html(enemies.fl.avgSpd);
				$("#" + htmlPrefix + "def").html(enemies.fl.avgDef);
				$("#" + htmlPrefix + "res").html(enemies.fl.avgRes);
			}
			else{
				$("#" + htmlPrefix + "hp").html("-");
				$("#" + htmlPrefix + "atk").html("-");
				$("#" + htmlPrefix + "spd").html("-");
				$("#" + htmlPrefix + "def").html("-");
				$("#" + htmlPrefix + "res").html("-");
			}

			for(var attribute in hero.include){
				if(hero.include[attribute]){
					$("#include_" + attribute).removeClass("notincluded").addClass("included");
				}
				else{
					$("#include_" + attribute).removeClass("included").addClass("notincluded");
				}
			}
		}
		else{
			//Custom enemy unselected
			$("#" + htmlPrefix + "name").val(hero.index);
			$("#" + htmlPrefix + "picture").attr("src","heroes/nohero.png");
			$("#" + htmlPrefix + "hp").html("-");
			$("#" + htmlPrefix + "currenthp").html("-");
			$("#" + htmlPrefix + "atk").html("-");
			$("#" + htmlPrefix + "spd").html("-");
			$("#" + htmlPrefix + "def").html("-");
			$("#" + htmlPrefix + "res").html("-");
			$("#" + htmlPrefix + "weapon_icon").attr("src","weapons/noweapon.png");
			$("#" + htmlPrefix + "specialcharge").html("-");
		}
	}
}

function showResultsTooltip(e,resultDiv){
	var resultId = resultDiv.id.substring(7);
	showingTooltip = true;
	$("#frame_tooltip").html(battles[resultId].fightText).show();
}

function hideResultsTooltip(){
	showingTooltip = false;
	$("#frame_tooltip").hide();
}

function addTurn(turnName){
	if(options.roundInitiators.length < 4){
		$("#turn_text_" + options.roundInitiators.length).html(turnName);
		$("#turn_" + options.roundInitiators.length).show();
		options.roundInitiators.push(turnName);
	}
	calculate();
}

function deleteTurn(initTurn){
	//keep ids the same, shift around text
	$("#turn_" + (options.roundInitiators.length - 1)).hide();
	options.roundInitiators.splice(initTurn,1);
	for(var i = 0; i < options.roundInitiators.length; i++){
		$("#turn_text_" + i).html(options.roundInitiators[i]);
	}
	calculate();
}

function showImportDialog(side,type){
	//side = challenger or enemies, type = import or export
	var label = "";
	if(type=="import"){
		label = "Import ";
		$("#export_collapse_label").hide();
		$("#importinput").val("");
		setTimeout(function(){
			$("#importinput")[0].focus();
		}, 10); //Because focus will be immediately lost from click
		$("#button_import").html("Import into calculator").off("click").on("click",function(){importText(side)});
	}
	else{
		label = "Export ";
		$("#button_import").html("Copy to clipboard").off("click").on("click",function(){copyExportText()});
		$("#export_collapse_label").show().off("click").on("click",function(){$("#importinput").val(getExportText(side))});
		$("#importinput").val(getExportText(side));
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

	$("#screen_fade").show();
	$("#frame_import").show();
}

function hideImportDialog(){
	$("#screen_fade").hide();
	$("#frame_import").hide();
}

function importText(side){
	var errorMsg = "";

	var text = $("#importinput").val();
	text = removeDiacritics(text); //Fuckin rauðrblade
	var importSplit = trySplit(text,["  \n","\n",";"])

	var importMode = "none";
	if(side=="enemies"){
		var firstLine = parseFirstLine(importSplit[0]);
		var firstLineHero = (typeof firstLine.index != "undefined")
		if(includesLike(importSplit[0],"CUSTOM LIST") || firstLineHero){
			var startLine = 1;
			if(firstLineHero){
				startLine = 0;
			}
			importMode = "cl";
			options.customEnemyList = "1";
			removeAllClEnemies();
			var clBlocks = importSplit.slice(startLine).join("!!!").replace(/!!!!!![!]+/g,"!!!!!!").split("!!!!!!");
			for(var clIndex = 0; clIndex < clBlocks.length; clIndex++){
				var clLines = clBlocks[clIndex].split("!!!");
				if(clLines[0].length > 2){
					parseHero(clLines);
				}
			}
			updateClList();
			updateEnemyUI();
		}
		//else if(includesLike(importSplit[0],"ENEMIES - FILTERED FULL LIST")){
		else{
			var startLine = 0;
			if(includesLike(importSplit[0],"FILTERED")){
				startLine = 1;
			}
			importMode = "fl";
			options.customEnemyList = "0";
			resetHero(enemies.fl,true);
			var hero = enemies.fl;
			var flLines = importSplit.slice(startLine);
			for(var flLine = 0; flLine < flLines.length; flLine++){
				var lineData = parseAttributeLine(flLines[flLine]);
				for(var key in lineData){
					hero[key] = lineData[key];
				}
			}
			initEnemyList();
			updateFlEnemies();
			updateEnemyUI();
		}
	}
	else{
		var firstLine = parseFirstLine(importSplit[0]);
		if(typeof firstLine.index != "undefined"){
			importMode = "challenger";
			challenger.index = -1;
			resetHero(challenger);
			parseHero(importSplit,firstLine);
			updateChallengerUI();
		}
		else{
			errorMsg = "Import challenger failed.";
		}
	}

	function parseHero(lines,firstLine){
		//challenger will pass first line because it needs to parse it to see if it's a challenger
		firstLine = firstLine || parseFirstLine(lines[0]);

		var hero;
		if(importMode == "challenger"){
			hero = challenger;
		}
		else{
			enemies.cl.list.push(new Hero());
			hero = enemies.cl.list[enemies.cl.list.length-1];
		}

		hero.index = firstLine.index;
		if(firstLine.rarity){
			hero.rarity = firstLine.rarity;
		}
		else{
			hero.rarity = 5;
		}

		if(firstLine.merge){
			hero.merge = firstLine.merge;
		}

		if(firstLine.boon){
			hero.boon = firstLine.boon;
		}
		if(firstLine.bane){
			hero.bane = firstLine.bane;
		}

		//Reset skills - they won't be reset with setSkills
		hero.weapon = -1;
		hero.special = -1;
		hero.a = -1;
		hero.b = -1;
		hero.c = -1;
		hero.s = -1;

		for(var line = 1; line < lines.length; line++){
			//Check if the line looks like a firstline; If yes, start parsing a new hero
			var firstLine = parseFirstLine(lines[line]);
			if(typeof firstLine.index != "undefined"){
				parseHero(lines.slice(line));
				break;
			}
			else{
				var lineData = parseAttributeLine(lines[line]);
				for(var key in lineData){
					hero[key] = lineData[key];
				}
			}
		}

		initHero(hero,true);
	}

	function parseFirstLine(line){
		var dataFound = {};
		//Try all lengths up to 20 characters to find hero name
		for(var tryLength = 2; tryLength <= 20; tryLength++){
			var tryString = removeEdgeJunk(line.slice(0,tryLength));
			var tryIndex = getIndexFromName(tryString,data.heroes);
			if(tryIndex != -1){
				//console.log(tryString);
				dataFound.index = tryIndex;
				//break; Don't break in case there is a hero with a name that is the beginning of another hero's name
			}
		}

		var tryRarityIndex = line.indexOf("★");
		if(tryRarityIndex == -1){
			tryRarityIndex = line.indexOf("*");
		}
		if(tryRarityIndex != -1){
			var tryRarity = parseInt(line.slice(tryRarityIndex - 1, tryRarityIndex)); //Try left side
			if(tryRarity >= 1 && tryRarity <= 5){
				dataFound.rarity = tryRarity;
			}
			// else{
			// 	tryRarity = parseInt(line.slice(tryRarityIndex + 1, tryRarityIndex+2)); //Try right side
			// 	if(tryRarity >= 1 && tryRarity <= 5){
			// 		dataFound.rarity = tryRarity;
			// 	}
			// }
		}

		var plusSplit = line.split("+");
		if(plusSplit.length > 1){ //Don't check if there's no pluses
			for(var plusLine = 0; plusLine < plusSplit.length; plusLine++){
				plusSplit[plusLine] = removeEdgeJunk(plusSplit[plusLine]).toLowerCase();

				var tryMerge = parseInt(plusSplit[plusLine].slice(0,2));
				if(tryMerge >= 1 && tryMerge <= 10){
					dataFound.merge = tryMerge;
				}
				// else{
				// 	tryMerge = parseInt(plusSplit[plusLine].slice(-2));
				// 	if(tryMerge >= 1 && tryMerge <= 10){
				// 		dataFound.merge = tryMerge;
				// 	}
				// }

				data.stats.forEach(function(stat){
					if(plusSplit[plusLine].slice(0,stat.length) == stat){
						dataFound.boon = stat;
					}
				});
			}
		}

		var minusSplit = line.split("-");
		if(minusSplit.length > 1){ //Don't check if there's no minuses
			for(var minusLine = 0; minusLine < minusSplit.length; minusLine++){
				minusSplit[minusLine] = removeEdgeJunk(minusSplit[minusLine]).toLowerCase();

				data.stats.forEach(function(stat){
					if(minusSplit[minusLine].slice(0,stat.length) == stat){
						dataFound.bane = stat;
					}
				});
			}
		}

		return dataFound;
	}

	function parseAttributeLine(line){
		var dataFound = {};

		var keyValue = trySplit(line,[":","-","="]);
		keyValue[0] = removeEdgeJunk(keyValue[0]);
		if(keyValue.length==1){
			keyValue[1] = "";
		}
		keyValue[1] = removeEdgeJunk(keyValue[1].toLowerCase());
		var key = "";
		var value;
		var buffObject = false;
		var skillName = false;
		var includeObject = false;

		if(includesLike(keyValue[0],"debuff")){ //do debuff first, because buff is contained in it
			key = "debuffs";
			buffObject = true;
		}
		else if(includesLike(keyValue[0],"buff")){
			key = "buffs";
			buffObject = true;
		}
		else if(includesLike(keyValue[0],"spur")){
			key = "spur";
			buffObject = true;
		}
		else if(includesLike(keyValue[0],"charge")){
			key = "precharge";
		}
		else if(includesLike(keyValue[0],"damage")){
			key = "damage";
		}
		else if(includesLike(keyValue[0],"rarity")){
			key = "rarity";
		}
		else if(includesLike(keyValue[0],"merge")){
			key = "merge";
		}
		else if(includesLike(keyValue[0],"boon")){
			key = "boon";
		}
		else if(includesLike(keyValue[0],"bane")){
			key = "bane";
		}
		else if(includesLike(keyValue[0],"include")){
			key = "include";
			includeObject = true;
		}
		else if(includesLike(keyValue[0],"weapon")){
			key = "weapon";
			skillName = true;
		}
		else if(includesLike(keyValue[0],"special")){
			key = "special";
			skillName = true;
		}
		else if(includesLike(keyValue[0],"passive a") || keyValue[0].toLowerCase().slice(-1) == "a"){
			key = "a";
			skillName = true;
		}
		else if(includesLike(keyValue[0],"passive b") || keyValue[0].toLowerCase().slice(-1) == "b"){
			key = "b";
			skillName = true;
		}
		else if(includesLike(keyValue[0],"passive c") || keyValue[0].toLowerCase().slice(-1) == "c"){
			key = "c";
			skillName = true;
		}
		else if(includesLike(keyValue[0],"passive s") || keyValue[0].toLowerCase().slice(-1) == "s"){
			key = "s";
			skillName = true;
		}
		
		if(includesLike(keyValue[0],"replace") && skillName){
			key = "replace" + capitalize(key);
			skillName = false;
		}

		if(buffObject){
			var value = getBlankBuffStats();
			var splitBuffs = trySplit(keyValue[1],[","]);
			for(var i = 0; i < splitBuffs.length; i++){
				data.buffStats.forEach(function(stat){
					if(includesLike(splitBuffs[i],stat)){
						var numMatch = splitBuffs[i].match(/-?[0-9]+/);
						if(numMatch){
							value[stat] = parseInt(numMatch[0]);
						}
					}
				});
			}
		}
		else if(skillName){
			value = getIndexFromName(removeEdgeJunk(keyValue[1]),data.skills,key);
			//console.log("Looking for " + key + ", found " + value);
		}
		else if(key=="boon" || key=="bane"){
			data.stats.forEach(function(stat){
				if(keyValue[1].indexOf(stat) != -1){
					value = stat;
				}
			});
		}
		else if(includeObject){
			var value = {"melee":0,"ranged":0,"red":0,"blue":0,"green":0,"gray":0,"physical":0,"magical":0,"infantry":0,"cavalry":0,"flying":0,"armored":0,"staff":0,"nonstaff":0};
			var splitInclude = trySplit(keyValue[1],[","," "]);
			for(var i = 0; i < splitInclude.length; i++){
				for(var includeKey in value){
					if(removeEdgeJunk(splitInclude[i]) == includeKey){
						value[includeKey] = 1;
					}
				}
			}
		}
		else{
			//Make all numbers
			keyValue[1] = keyValue[1].replace("true","1");
			keyValue[1] = keyValue[1].replace("false","0");
			var numMatch = keyValue[1].match(/-?\d/);
			if(numMatch){
				value = parseInt(numMatch[0]);
			}
		}

		//console.log(key + ": " + value + " (from " + keyValue[1] + ")");

		if(key && typeof value != "undefined"){
			dataFound[key] = value;
		}

		return dataFound;
	}

	if(errorMsg){
		alert("Error: " + errorMsg);
	}

	validateNumberInputs()
	hideImportDialog();
	calculate();
}

function removeEdgeJunk(string){
	return string.replace(/^[\s\._\-]+/, "").replace(/[\s\._\-]+$/, "");
}

//Try to find a string in mainText that's sorta like findText
function includesLike(mainText,findText){
	mainText = mainText.toLowerCase().replace(/[\s\._\-]+/g, "");
	findText = findText.toLowerCase().replace(/[\s\._\-]+/g, "");
	return mainText.indexOf(findText) != -1;
}

function trySplit(string,splits){
	for(var i = 0; i < splits.length; i++){
		var stringSplit = string.split(splits[i]);
		if(stringSplit.length > 1){
			return stringSplit;
		}
	}

	return [string];
}

function getExportText(side){
	var delimiter = "  \n";
	if($("#export_collapse").is(":checked")){
		delimiter = ";";
	}

	var exportText = "";
	if(side=="challenger"){
		exportText = getHeroExportText(challenger);
	}
	else if(options.customEnemyList==1){
		if(enemies.cl.list.length){
			exportText = "ENEMIES - CUSTOM LIST" + delimiter;
			for(var i = 0; i < enemies.cl.list.length; i++){
				exportText += getHeroExportText(enemies.cl.list[i]) + delimiter;
			}
		}
	}
	else{
		exportText = "ENEMIES - FILTERED FULL LIST" + delimiter;
		var includeList = [];
		for(var key in enemies.fl.include){
			if(enemies.fl.include[key]){
				includeList.push(key);
			}
		}
		exportText += "Include: " + includeList.join(", ") + delimiter;

		exportText += "Rarity: " + enemies.fl.rarity + "★" + delimiter;
		if(enemies.fl.merge > 0){
			exportText += "Merge: +" + enemies.fl.merge + delimiter;
		}
		if(enemies.fl.boon != "none"){
			exportText += "Boon: +" + enemies.fl.boon + delimiter;
		}
		if(enemies.fl.bane != "none"){
			exportText += "Bane: -" + enemies.fl.bane + delimiter;
		}

		data.skillSlots.forEach(function(slot){
			if(enemies.fl[slot] != -1){
				exportText += capitalize(slot) + ": " + data.skills[enemies.fl[slot]].name + delimiter;
				exportText += "Replace " + capitalize(slot) + ": " + !!parseInt(enemies.fl["replace" + capitalize(slot)]) + delimiter;
			}
		});

		var statusText = "";
		data.buffTypes.forEach(function(buffType){
			var notZero = [];
			data.buffStats.forEach(function(stat){
				if(enemies.fl[buffType][stat] != 0){
					notZero.push(stat + " " + enemies.fl[buffType][stat]);
				}
			});
			if(notZero.length){
				statusText += capitalize(buffType) + ": " + notZero.join(", ") + delimiter;
			}
		});

		if(enemies.fl.damage != 0){
			statusText += "Damage: " + enemies.fl.damage + delimiter;
		}
		if(enemies.fl.precharge != 0){
			statusText += "Charge: " + enemies.fl.precharge + delimiter;
		}

		if(statusText){
			exportText += ":::Status" + delimiter+statusText;
		}
	}

	//Helper function for single heroes
	function getHeroExportText(hero){
		var heroExportText = "";
		if(hero.index != -1){
			heroExportText += data.heroes[hero.index].name + " (" + hero.rarity + "★";
			if(hero.merge > 0){
				heroExportText += "+" + hero.merge;
			}
			if(hero.boon != "none"){
				heroExportText += " +" + hero.boon;
			}
			if(hero.bane != "none"){
				heroExportText += " -" + hero.bane;
			}
			heroExportText += ")" + delimiter;

			//Might not do it this way because order is not guaranteed
			data.skillSlots.forEach(function(slot){
				if(hero[slot] != -1){
					heroExportText += capitalize(slot) + ": " + data.skills[hero[slot]].name + delimiter;
				}
			});

			var statusText = "";
			data.buffTypes.forEach(function(buffType){
				var notZero = [];
				data.buffStats.forEach(function(stat){
					if(hero[buffType][stat] != 0){
						notZero.push(stat + " " + hero[buffType][stat]);
					}
				});
				if(notZero.length){
					statusText += capitalize(buffType) + ": " + notZero.join(", ") + delimiter;
				}
			});

			if(hero.damage != 0){
				statusText += "Damage: " + hero.damage + delimiter;
			}
			if(hero.precharge != 0){
				statusText += "Charge: " + hero.precharge + delimiter;
			}

			if(statusText){
				heroExportText += ":::Status" + delimiter+statusText;
			}
		}
		return heroExportText;
	}

	if(!exportText){
		//Rude comment if nothing is exported
		exportText = "Nothing. You've exported nothing.";
	}
	return exportText;
}

function copyExportText(){
	$("#importinput")[0].select();
	var successful = document.execCommand('copy');
	if(!successful){
		$("#button_import").html("Ctrl+C to finish the job")
	}
}

function switchEnemySelect(newVal){
	var willCalculate = false;
	if(newVal != options.customEnemyList){
		willCalculate = true;
	}
	options.customEnemyList = newVal;
	if(options.customEnemyList==1){
		$("#enemies_full_list").hide();
		$("#enemies_custom_list").show();
	}
	else{
		$("#enemies_custom_list").hide();
		$("#enemies_full_list").show();
	}

	if(willCalculate){
		calculate();
	}	
}

//changedNumber: Whether the number of enemies has changed - must do more intensive updating if this is the case
function updateClList(){
	var lastEnemy = enemies.cl.list.length - 1;
	//Set selected enemy if there are enemies but none is selected
	if(lastEnemy != -1 && options.customEnemySelected == -1){
		options.customEnemySelected = lastEnemy;
	}
	var lastElement = -1;
	var enemyElements = $(".cl_enemy");
	$(".clSelected").removeClass("clSelected");
	//Show/hide existing elements based on number currently in list
	for(var element = 0; element < enemyElements.length; element++){
		var clIndex = parseInt($(enemyElements[element]).attr("data-clindex"));
		if(clIndex > lastElement){
			lastElement = clIndex;
		}
		if(clIndex <= lastEnemy){
			//Update the text of the items in the list
			var enemyIndex = enemies.cl.list[clIndex].index;
			var enemyName = "New enemy";
			if(enemyIndex >= 0){
				enemyName = data.heroes[enemyIndex].name;
			}
			$("#cl_enemy" + clIndex + "_name").html(enemyName);
			if(clIndex == options.customEnemySelected){
				$("#cl_enemy" + clIndex).addClass("clSelected");
			}
			$(enemyElements[element]).show();
		}
		else{
			$(enemyElements[element]).hide();
		}
	}

	//Create new elements if needed
	for(var clIndex = lastElement + 1; clIndex <= lastEnemy; clIndex++){
		//Update the text of the items in the list
		var enemyIndex = enemies.cl.list[clIndex].index;
		var enemyName = "New enemy";
		if(enemyIndex >= 0){
			enemyName = data.heroes[enemyIndex].name;
		}

		//Need to create a new element - the list is not pre-populated with hidden elements
		var clEnemyHTML = "<div class=\"cl_enemy button\" id=\"cl_enemy" + clIndex + "\" data-clindex=\"" + clIndex + "\" onclick=\"selectClEnemy(" + clIndex + ")\"><span id=\"cl_enemy" + clIndex + "_name\">" + enemyName;
		clEnemyHTML += "</span><div class=\"cl_delete_enemy button\" id=\"cl_enemy" + clIndex + "_delete\" onclick=\"deleteClEnemy(event," + clIndex + ");\" onmouseover=\"undoClStyle(this)\" onmouseout=\"redoClStyle(this)\">x</div></div>";
		$("#cl_enemylist_list").append(clEnemyHTML);
	}
}

function undoClStyle(element){
	$(element).parent().addClass("cl_destyled");
}

function redoClStyle(element){
	$(element).parent().removeClass("cl_destyled");
}

function validateNumberInputs(){
	//For import function
	$("input[type=number]").toArray().forEach(function(element){
		var min = $(element).attr("min");
		var max = $(element).attr("max");
		if(typeof min != "undefined" && typeof max != "undefined"){
			var newVal = verifyNumberInput(element,min,max);
			var dataVar = $(element).attr("data-var");
			changeDataVar(dataVar, newVal);
			$(element).val(newVal);
		}
	});
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//Functions that get shit done

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

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

function calculate(manual){
	//console.log("calculated");
	//manual = true if button was clicked
	//calculates results and also adds them to page
	if(options.autoCalculate || manual){
		if(challenger.index!=-1 && options.roundInitiators.length > 0 && enemies.fl.list.length > 0){
			var wins = 0;
			var losses = 0;
			var inconclusive = 0;

			battles = [];
			resultHTML = [];

			var enemyList = [];
			var mustConfirm = false;
			if(options.customEnemyList == 1){
				enemyList = enemies.cl.list;
			}
			else{
				enemyList = enemies.fl.list;
				mustConfirm = true;
			}
			for(var i = 0;i<enemyList.length;i++){
				if(enemyList[i].index != -1 && !mustConfirm || enemyList[i].included){
					var fight = new Battle(challenger, enemyList[i], {
						roundInitiators: options.roundInitiators,
						id: i
					});
					battles.push(fight);
				}
			}

			for(var i = 0; i < battles.length;i++){

				if(battles[i].outcome=="loss"){
					losses++;
				}
				else if(battles[i].outcome=="win"){
					wins++;
				}
				else if(battles[i].outcome=="inconclusive"){
					inconclusive++;
				}

				resultHTML.push({sortWeight:getComparisonWeight(battles[i]), html:battles[i].fightHTML, passFilters:battles[i].passFilters});
			}

			resultHTML.sort(function(a,b){
				//sort fights from best wins to worst losses
				//first by win, then by rounds, then by hp
				if(a.sortWeight == b.sortWeight){
					return 0;
				}
				else{
					return (a.sortWeight < b.sortWeight)*2-1;
				}
			});

			outputResults();
			outputStatistics();
		}
	}
}

function outputStatistics(){
	if(battles.length > 0){
		var wins = 0;
		var losses = 0;
		var inconclusive = 0;
		for(var i = 0; i < battles.length;i++){
			if(battles[i].outcome=="loss"){
				losses++;
			}
			else if(battles[i].outcome=="win"){
				wins++;
			}
			else if(battles[i].outcome=="inconclusive"){
				inconclusive++;
			}
		}

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

function getComparisonWeight(fightResult){
	var weight = 0;
	if(fightResult.enemy.hp <= 0){
		weight += 100;
	}
	else{
		weight += (1 - (fightResult.enemy.hp / fightResult.enemy.maxHp)) * 40;
	}
	if(fightResult.challenger.hp <= 0){
		weight -= 100;
	}
	else{
		weight -= (1 - (fightResult.challenger.hp / challenger.hp)) * 40;
	}
	weight /= fightResult.rounds;
	//console.log(fightResult.challenger.hp + " - " + fightResult.enemy.hp + ", " + fightResult.rounds + "rnd: " + weight);
	return weight;
}

function outputResults(){
	//function separate from calculation so user can re-sort without recalculating
	//options.sortOrder is 1 or -1
	//Hide results that aren't different if view is set to changed only
	//options.viewFilter is 0 or 1 or 2
	var outputHTML = "";

	if(options.sortOrder==1){
		for(var i = 0; i < resultHTML.length; i++){
			if(filterResult(i)){
				outputHTML += resultHTML[i].html;
			}
		}
	}
	else if(options.sortOrder==-1){
		for(var i = resultHTML.length-1; i >= 0; i--){
			if(filterResult(i)){
				outputHTML += resultHTML[i].html;
			}
		}
	}
	$("#results_list").html(outputHTML);
}

//Helper function for filtering
//Will return true if include or false if not
function filterResult(i){
	//console.log(resultHTML[i].passFilters.indexOf(options.viewFilter));
	//console.log(resultHTML[i].passFilters);
	return resultHTML[i].passFilters.indexOf(options.viewFilter) > -1;
}

function exportCalc(){
	//Exports all results to csv - doesn't take filters into account
	//If people complain, I will make it take the filters into account

	if(battles.length>0){
		var csvString = "data:text/csv;charset=utf-8,";

		//Column headers
		//Should take out buffs and stuff that aren't used to minimize columns?
		csvString += "Challenger,cColor,cMovetype,cWeapontype,cRarity,cMerge,cBoon,cBane,cMaxHP,cStartHP,cAtk,cSpd,cDef,cRes,cWeapon,cSpecial,cPrecharge,cA,cB,cC,cS,cBuffAtk,cBuffSpd,cBuffDef,cBuffRes,cDebuffAtk,cDebuffSpd,cDebuffDef,cDebuffRes,cSpurAtk,cSpurSpd,cSpurDef,cSpurRes,";
		csvString += "Enemy,eColor,eMovetype,eWeapontype,eRarity,eMerge,eBoon,eBane,eMaxHP,eStartHP,eAtk,eSpd,eDef,eRes,eWeapon,eSpecial,ePrecharge,eA,eB,eC,eS,eBuffAtk,eBuffSpd,eBuffDef,eBuffRes,eDebuffAtk,eDebuffSpd,eDebuffDef,eDebuffRes,eSpurAtk,eSpurSpd,eSpurDef,eSpurRes,";
		csvString += "FirstTurnThreaten,StartTurn,UseGaleforce,Initiator1,Initiator2,Initiator3,Initiator4,Outcome,cEndHP,eEndHP,Rounds,Overkill,BattleLog\n";

		battles.forEach(function(result){
			csvString += data.heroes[challenger.index].name + ",";
			csvString += data.heroes[challenger.index].color + ",";
			csvString += data.heroes[challenger.index].movetype + ",";
			csvString += data.heroes[challenger.index].weapontype + ",";
			csvString += challenger.rarity + ",";
			csvString += challenger.merge + ",";
			csvString += challenger.boon + ",";
			csvString += challenger.bane + ",";
			csvString += challenger.hp + ",";
			csvString += Math.max(challenger.hp - challenger.damage,1) + ",";
			csvString += challenger.atk + ",";
			csvString += challenger.spd + ",";
			csvString += challenger.def + ",";
			csvString += challenger.res + ",";
			if(challenger.weapon != -1){
				csvString += data.skills[challenger.weapon].name + ",";
			}
			else{
				csvString += ",";
			}
			if(challenger.special != -1){
				csvString += data.skills[challenger.special].name + ",";
			}
			else{
				csvString += ",";
			}
			csvString += challenger.precharge + ",";
			if(challenger.a != -1){
				csvString += data.skills[challenger.a].name + ",";
			}
			else{
				csvString += ",";
			}
			if(challenger.b != -1){
				csvString += data.skills[challenger.b].name + ",";
			}
			else{
				csvString += ",";
			}
			if(challenger.c != -1){
				csvString += data.skills[challenger.c].name + ",";
			}
			else{
				csvString += ",";
			}
			if(challenger.s != -1){
				csvString += data.skills[challenger.s].name + ",";
			}
			else{
				csvString += ",";
			}
			csvString += challenger.buffs.atk + ",";
			csvString += challenger.buffs.spd + ",";
			csvString += challenger.buffs.def + ",";
			csvString += challenger.buffs.res + ",";
			csvString += challenger.debuffs.atk + ",";
			csvString += challenger.debuffs.spd + ",";
			csvString += challenger.debuffs.def + ",";
			csvString += challenger.debuffs.res + ",";
			csvString += challenger.spur.atk + ",";
			csvString += challenger.spur.spd + ",";
			csvString += challenger.spur.def + ",";
			csvString += challenger.spur.res + ",";

			var enemy = result.enemy;
			csvString += enemy.name + ",";
			csvString += enemy.color + ",";
			csvString += enemy.moveType + ",";
			csvString += enemy.weaponType + ",";
			csvString += enemy.rarity + ",";
			csvString += enemy.merge + ",";
			csvString += enemy.boon + ",";
			csvString += enemy.bane + ",";
			csvString += enemy.maxHp + ",";
			csvString += Math.max(enemy.maxHp - enemy.damage,1) + ",";
			csvString += enemy.atk + ",";
			csvString += enemy.spd + ",";
			csvString += enemy.def + ",";
			csvString += enemy.res + ",";
			if(enemy.weaponIndex != -1){
				csvString += data.skills[enemy.weaponIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			if(enemy.specialIndex != -1){
				csvString += data.skills[enemy.specialIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			csvString += enemies.fl.precharge + ",";
			if(enemy.aIndex != -1){
				csvString += data.skills[enemy.aIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			if(enemy.bIndex != -1){
				csvString += data.skills[enemy.bIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			if(enemy.cIndex != -1){
				csvString += data.skills[enemy.cIndex].name + ",";
			}
			else{
				csvString += ",";
			}
			if(enemy.sIndex != -1){
				csvString += data.skills[enemy.sIndex].name + ",";
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

			csvString += options.threatenRule + ",";
			csvString += options.startTurn + ",";
			csvString += options.useGaleforce + ",";
			for(var rnd = 0; rnd < 4;rnd++){
				if(!!options.roundInitiators[rnd]){
					csvString += options.roundInitiators[rnd].substring(0,options.roundInitiators[rnd].length-10) + ",";
				}
				else{
					csvString += ",";
				}
			}
			var outcome = "Inconclusive";
			var overkill = 0;
			if(result.challenger.hp==0){
				outcome = "Loss";
				overkill = result.challenger.overkill;
			}
			else if(result.enemy.hp==0){
				outcome = "Win";
				overkill = result.enemy.overkill;
			}
			csvString += outcome + ",";
			csvString += result.challenger.hp + ",";
			csvString += result.enemy.hp + ",";
			csvString += result.rounds + ",";
			csvString += overkill + ",";
			var deTaggedLog = result.fightText.replace(/<br\/?>/g, "; ");
			deTaggedLog = deTaggedLog.replace(/<\/?[^>]+(>|$)/g, "");
			csvString += "\"" + deTaggedLog + "\"";

			csvString += "\n";
		});

		var encodedUri = encodeURI(csvString);
		var fakeLink = document.createElement("a");
		fakeLink.setAttribute("href", encodedUri);
		var date = new Date();
		fakeLink.setAttribute("download", "feh_simulator_" + (date.getYear()+1900) + "-" + (date.getMonth()+1) + "-" + date.getDate() + "_" + data.heroes[challenger.index].name + ".csv");
		document.body.appendChild(fakeLink);
		fakeLink.click();
	}
	else{
		alert("No results!");
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//Objects (Battle, Hero, ActiveHero)

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//Represents a fight between two ActiveHeros
function Battle(challenger, enemy, options){
	var battleBaseAttributes = {
		challenger: new ActiveHero(challenger, this),
		enemy: new ActiveHero(enemy, this),
		roundInitiators: [],
		rounds: 0,
		startTurn: 0,
		turn: 0,
		weaponAdvantageBonus: 1,
		challengerEffectiveBonus: 1,
		enemyEffectiveBonus: 1,
		fightText: "",
		fightHTML: "",
		resultText: "",
		passFilters: [],
		outcome: "unfinished",
		id: -1
	};

	for(var key in battleBaseAttributes){
		this[key] = battleBaseAttributes[key];
	}
	for(var key in options){
		this[key] = options[key];
	}

	for(var round = 1; round <= this.roundInitiators.length; round++){
		this.rounds = round;
		this.turn = this.startTurn + round - 1;
		this.fightText += "<div class=\"fight_round\"><span class=\"bold\">Round " + round + ": ";
		if(this.roundInitiators[round-1]=="Challenger initiates"){
			this.fightText += this.challenger.name + " initiates</span><br>";
			this.challenger.attack(this.enemy);
		}
		else{
			this.fightText += this.enemy.name + " initiates</span><br>";
			this.enemy.attack(this.challenger);
		}

		var winner = "";
		if(this.enemy.hp <= 0){
			winner = this.challenger.name;
			this.outcome = "win";
		}
		else if(this.challenger.hp <= 0){
			winner = this.enemy.name;
			this.outcome = "loss";
		}
		if(winner){
			var winMessages = [
				"Good job",
				"Congratulations",
				"You did it",
				"A winner is",
				"Let's all congratulate",
				"You really did your best,",
				"You're amazing",
				"Awesome job",
				"Spectacular,",
				"Expertly done,",
				"Yaaaaaaay",
				"Let's go",
				"You can get dat booty,"
			];
			this.fightText += winMessages[Math.floor(Math.random() * winMessages.length)] + " " + winner + "!";
			break;
		}

		this.fightText += "</div>";
	}

	if(!this.outcome){
		this.outcome == "inconclusive";
	}
	else{
		var spanClass = "<span class=\"blue\">win</span>, ";
		if(this.outcome == "loss"){
			spanClass = "<span class=\"red\">loss</span>, ";
		}
		var roundPlural = " rounds"
		if(this.rounds == 1){
			roundPlural = " round";
		}

		this.resultText += "<span class=\"red\">loss</span>, " + this.rounds + roundPlural;
	}

	//FILTERS
	this.passFilters = ["all"];
	this.passFilters.push(this.outcome);

	if(this.enemy.hero.lastFightResult){
		var prevResult = "";
		if(this.enemy.hero.lastFightResult.indexOf("win") > -1){
			prevResult = "win";
		}
		else if(this.enemy.hero.lastFightResult.indexOf("loss") > -1){
			prevResult = "loss";
		}
		else if(this.enemy.hero.lastFightResult.indexOf("inconclusive") > -1){
			prevResult = "inconclusive";
		}

		if(this.outcome != prevResult){
			this.passFilters.push("changeVictor");
		}

		var prevRoundsMatch = this.enemy.hero.lastFightResult.match(/([1-4]) rounds?/);
		var prevRounds = 0;
		if(prevRoundsMatch){
			prevRounds = prevRoundsMatch[1];
		}

		if(this.rounds != prevRounds && this.outcome == prevResult && this.outcome != "inconclusive"){
			//changeRounds means rounds changed but not result
			this.passFilters.push("changeRounds");
		}

		var prevHealthMatch = this.enemy.hero.lastFightResult.match(/([0-9]+)<\/span> &ndash; <span class="red">([0-9]+)/);
		var prevOverkillMatch = this.enemy.hero.lastFightResult.match(/([0-9]+)<\/span> overkill/);
		var prevChallengerEndHealth;
		var prevEnemyEndHealth;
		var prevOverkill;

		var currentChallengerEndHealth = this.challenger.hp;
		var currentEnemyEndHealth = this.enemy.hp;
		if(this.enemy.overkill){
			currentEnemyEndHealth -= this.enemy.overkill;
		}
		else if(this.challenger.overkill){
			currentChallengerEndHealth -= this.challenger.overkill;
		}

		if(prevHealthMatch){
			prevChallengerEndHealth = parseInt(prevHealthMatch[1]);
			prevEnemyEndHealth = parseInt(prevHealthMatch[2]);
		}

		if(prevOverkillMatch){
			prevOverkill = parseInt(prevOverkillMatch[1]);

			if(prevChallengerEndHealth == 0){
				prevChallengerEndHealth -= prevOverkill;
			}
			else if(prevEnemyEndHealth == 0){
				prevEnemyEndHealth -= prevOverkill;
			}
			
		}

		if(this.rounds == prevRounds && this.outcome == prevResult && (currentChallengerEndHealth != prevChallengerEndHealth || currentEnemyEndHealth != prevEnemyEndHealth)){
			this.passFilters.push("changeDamage");
		}
	}

	//RESULT OUTPUT BOX HTML
	var weaponName = "None";
	var specialName = "None";
	var aName = "noskill";
	var bName = "noskill";
	var cName = "noskill";
	var sName = "noskill";
	if(this.enemy.weaponIndex != -1){
		weaponName = data.skills[this.enemy.weaponIndex].name;
	}
	if(this.enemy.specialIndex != -1){
		specialName = data.skills[this.enemy.specialIndex].name;
	}
	if(this.enemy.aIndex != -1){
		aName = data.skills[this.enemy.aIndex].name.replace(/\s/g,"_");
	}
	if(this.enemy.bIndex != -1){
		bName = data.skills[this.enemy.bIndex].name.replace(/\s/g,"_");
	}
	if(this.enemy.cIndex != -1){
		cName = data.skills[this.enemy.cIndex].name.replace(/\s/g,"_");
	}
	if(this.enemy.sIndex != -1){
		sName = data.skills[this.enemy.sIndex].name.replace(/\s/g,"_");
	}

	var weaponTypeName = this.enemy.weaponType;
	if(weaponTypeName == "dragon"){
		weaponTypeName = this.enemy.color + "dragon";
	}

	this.fightHTML = ["<div class=\"results_entry\" id=\"result_" + this.id + "\" onmouseover=\"showResultsTooltip(event,this);\" onmouseout=\"hideResultsTooltip();\">",
		"<div class=\"results_hpbox\">",
			"<div class=\"results_hplabel\">HP</div>",
			"<div class=\"results_hpnums\">",
				"<span class=\"results_challengerhp\">" + this.challenger.hp + "</span> &ndash; <span class=\"results_enemyhp\">" + this.enemy.hp + "</span>",
			"</div>",
		"</div>",
		"<div class=\"frame_enemypicture\"><img class=\"results_enemypicture\" src=\"heroes/" + this.enemy.name + ".png\"/></div>",
		"<div class=\"results_topline\">",
			"<img class=\"weaponIconSmall\" src=\"weapons/" + weaponTypeName + ".png\"/><span class=\"results_enemyname\">" + this.enemy.name + "</span> (<span class=\"results_outcome\">" + this.resultText + "</span>)",
			"<div class=\"results_previousresult\">" + this.enemy.hero.lastFightResult + "</div>",
		"</div>",
		"<div class=\"results_bottomline\">",
			"<span class=\"results_stat\">HP: " + this.enemy.maxHp + "</span><span class=\"results_stat\">Atk: " + this.enemy.atk + "</span><span class=\"results_stat\">Spd: " + this.enemy.spd + "</span><span class=\"results_stat\">Def: " + this.enemy.def + "</span><span class=\"results_stat\">Res: " + this.enemy.res + "</span><div class=\"results_skills\"><span class=\"results_stat\"><img class=\"skill_picture\" src=\"skills/weapon.png\"/>" + weaponName + "</span><span class=\"results_stat\"><img class=\"skill_picture\" src=\"skills/special.png\"/>" + specialName + "</span><span class=\"results_stat\"><img class=\"skill_picture\" src=\"skills/" + aName + ".png\"/><img class=\"skill_picture\" src=\"skills/" + bName + ".png\"/><img class=\"skill_picture\" src=\"skills/" + cName + ".png\"/><img class=\"skill_picture\" src=\"skills/" + sName + ".png\"/></span></div>",
		"</div>",
	"</div>",""].join("\n");

	this.enemy.hero.lastFightResult = "Previous result: " +this.resultText + ", <span class=\"blue\">" + this.challenger.hp + "</span> &ndash; <span class=\"red\">" + this.enemy.hp + "</span>";

	// 	return {
	// 		"rounds":rounds,
	// 		"fightText":fightText,
	// 		"enemy":this.enemy,
	// 		"challenger":this.challenger,
	// 		"outcome":outcome,
	// 		"fightHTML":fightHTML,
	// 		"passFilters":passFilters
	// 	};
	// }
}

//Represents an individual hero
//options can be a number representing index or an object with key-value pairs to be passed in
function Hero(options){
	if(typeof options == "undefined"){
		options = {"index": -1};
	}
	if($.isNumeric(options)){
		options = {"index": options};
	}

	//Start with defaults
	var heroBaseAttributes = {
		"index":-1,"hp":1,"atk":1,"spd":1,"def":1,"res":1,"weapon":-1,"special":-1,"a":-1,"b":-1,"c":-1,"s":-1,
		"buffs": getBlankBuffStats(), "debuffs": getBlankBuffStats(), "spur": getBlankBuffStats(), 
		"boon": "none", "bane": "none", "merge":0, "rarity": 5, "precharge":0, "damage": 0, "challenger": false,
		validSkills: getAllArrayIndices(data.skills)
	};
	for(var key in heroBaseAttributes){
		this[key] = heroBaseAttributes[key];
	}

	this.setName = function(){
		//Set name and stats if valid hero index
		if(this.index >= 0){
			this.name = data.heroes[this.index].name;
		}
		else{
			this.name = "Custom";
		}
	}

	//Get all base stats including merge bonus and rarity bonus (returns object)
	//Best to do them all at once because of the way merge and rarity bonuses are calculated
	this.getBaseStats = function(){
		if(this.index >= 0){
			var statBases = {
				//Bases are for 5* - turn them into 1*
				"hp": data.heroes[this.index]["basehp"] - 2,
				"atk": data.heroes[this.index]["baseatk"] - 2,
				"spd": data.heroes[this.index]["basespd"] - 2,
				"def": data.heroes[this.index]["basedef"] - 2,
				"res": data.heroes[this.index]["baseres"] - 2,
			}

			//Modify base stats based on rarity
			//Order that base stats increase by rarity is similar to merge bonuses, except HP always happens at 3* and 5*
			//Rarity base boosts don't taken into account boons/banes
			var rarityBoost = getBlankStats();
			var rarityBaseOrder = ["atk","spd","def","res"];
			var boostPriority = {"hp":4,"atk":3,"spd":2,"def":1,"res":0};
			rarityBaseOrder.sort(function(a,b){
				if(statBases[a]>statBases[b]){
					return -1;
				}
				else if(statBases[a]<statBases[b]){
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
			var rarityBoostCount = Math.floor((this.rarity-1) * 2.5);

			for(var i = 0; i < rarityBoostCount; i++){
				rarityBoost[rarityBaseOrder[i%5]]++;
			}

			statBases = addStats(statBases,rarityBoost);

			//Now add boon/bane, since rarity boost is done
			if(this.boon != "none"){
				statBases[this.boon]++;
			}
			if(this.bane != "none"){
				statBases[this.bane]--;
			}

			//Add merge bonuses
			//Order that merges happen is highest base stats, tiebreakers go hp->atk->spd->def->res
			//Merge bonuses DO take boon/bane into account
			var mergeBoost = getBlankStats();
			var mergeOrder = ["hp","atk","spd","def","res"];
			mergeOrder.sort(function(a,b){
				if(statBases[a]>statBases[b]){
					return -1;
				}
				else if(statBases[a]<statBases[b]){
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

			var mergeBoostCount = this.merge*2;
			for(var i = 0; i < mergeBoostCount; i++){
				mergeBoost[mergeOrder[i%5]]++;
			}

			statBases = addStats(statBases,mergeBoost);

			return statBases;
		}
		else{
			console.warn("Tried to get base stats for custom hero");
			return getBlankStats();
		}
	}

	//Get growth of a stat, taking boon/bane into consideration
	this.getGrowthBonus = function(stat){
		if(this.index >= 0){
			var growthLevel = data.heroes[this.index][stat + "growth"];
			if(this.boon == stat){
				growthLevel++;
			}
			if(this.bane == stat){
				growthLevel--;
			}
			return getGrowthValue(growthLevel,this.rarity);
		}
		else{
			console.warn("Tried to get growth for custom hero");
			return 0;
		}
	}

	this.getSkillBonuses = function(){
		var skillStats = getBlankStats();

		//Add stats based on skills
		var thisAlias = this;
		data.skillSlots.forEach(function(slot){
			if(thisAlias[slot] >= 0){
				skillStats = addStats(skillStats,data.skills[thisAlias[slot]]);
			}
		});

		return skillStats;
	}

	//Gets the value of a stat from base/merge/growth/rarity, NOT the value of the stat set on the hero
	this.getStatValues = function(){
		var stats = addStats(this.getBaseStats(), this.getSkillBonuses());
		var growthBonuses = getBlankStats();
		for(var stat in growthBonuses){
			growthBonuses[stat] = this.getGrowthBonus(stat);
		}
		return addStats(stats,growthBonuses);
	}

	//Actually set stats on self
	this.setStats = function(){
		if(this.index >= 0){
			var statValues = this.getStatValues()
			for(var key in statValues){
				this[key] = statValues[key];
			}
		}
	}

	//Take inputs and set own data to inputs and do stuff if needed
	this.modify = function(data){
		var changeStatVars = ["index","boon", "bane", "merge", "rarity", "a", "s", "weapon"];
		var changeNameVars = ["index"];
		var mustChangeStats = false;
		var mustChangeName = false;

		for(var key in data){
			this[key] = data[key];
			if(changeStatVars.indexOf(key) != -1){
				mustChangeStats = true;
			}
			if(changeNameVars.indexOf(key) != -1){
				mustChangeName = true;
			}
		}

		if(mustChangeStats){
			this.setStats();
		}
		if(mustChangeName){
			this.setName();
		}
	}

	this.modify(options);
}

//ActiveHero is a class for simulating a unit in a battle
//This is where most of the calculations happen
//hero is a hero index or Hero object
function ActiveHero(hero, battle){
	if(typeof hero == "undefined"){
		hero = {};
	}
	if($.isNumeric(hero)){
		hero = new Hero(hero);
	}

	this.hero = hero;
	this.battle = battle;

	this.combatBuffs = getBlankBuffStats();
	this.combatDebuffs = getBlankBuffStats();
	this.combatSpur = getBlankBuffStats();

	this.skillNames = [];

	this.challenger = !!hero.challenger; //Will be undefined if not challenger
	if(typeof hero.index == "undefined"){
		this.heroIndex = -1;
	}
	else{
		this.heroIndex = hero.index;
	}

	if(this.heroIndex == -1){
		this.name = "Error " + ["Waifu","Boy","Lord","Husbando","Lady","Girl"][Math.floor(Math.random() * 6)];
		this.moveType = "infantry";
		this.weaponType = "sword";
		this.color = "red";
		console.warn("Error creating hero: no heroIndex");
	}
	else if(this.heroIndex == -2){
		this.name = "Custom";
		this.moveType = hero.customMove;
		this.weaponType = hero.customWeapon;
		this.color = hero.customColor;
	}
	else{
		this.name = data.heroes[this.heroIndex].name || "Error " + ["Waifu","Boy","Lord","Husbando","Lady","Girl"][Math.floor(Math.random() * 6)];
		this.moveType = data.heroes[this.heroIndex].movetype || "infantry";
		this.weaponType = data.heroes[this.heroIndex].weapontype || "sword";
		this.color = data.heroes[this.heroIndex].color || "red";
	}
	
	this.rarity = hero.rarity || 5;
	this.merge = hero.merge || 0;

	this.weaponIndex = hero.weapon || -1;	
	this.specialIndex = hero.special || -1;
	this.aIndex = hero.a || -1;
	this.bIndex = hero.b || -1;
	this.cIndex = hero.c || -1;
	this.sIndex = hero.s || -1;

	this.boon = hero.boon || "none";
	this.bane = hero.bane || "none";
	this.damage = hero.damage || 0;

	this.buffs = hero.buffs || getBlankBuffStats();
	this.debuffs = hero.debuffs || getBlankBuffStats();
	this.spur = hero.spur || getBlankBuffStats();

	this.maxHp = hero.hp || 1;
	this.atk = hero.atk || 1;
	this.spd = hero.spd || 1;
	this.def = hero.def || 1;
	this.res = hero.res || 1;

	this.hp = Math.max(this.maxHp - hero.damage,1);
	this.precharge = hero.precharge || 0;

	//Make a list of skill names for easy reference
	var thisAlias = this;
	data.skillSlots.forEach(function(slot){
		if(this[slot+"Index"] > -1){
			this.skillNames.push(data.skills[this[slot+"Index"]].name);
		}
	});

	//Categorize weapon
	if(data.rangedWeapons.indexOf(this.weaponType)!=-1){
		this.range = "ranged";
	}
	else{
		this.range = "melee";
	}
	if(data.physicalWeapons.indexOf(this.weaponType)!=-1){
		this.attackType = "physical";
	}
	else{
		this.attackType = "magical";
	}

	this.charge = 0;
	this.initiator = false;
	this.panicked = false;
	this.lit = false;
	this.didAttack = false;

	this.has = function(skill){
		//finds if hero has a skill that includes the string given
		//returns 1 if found, or a number 1-3 if level of skill is found
		//For exact matches, see "hasExactly"
		var index = -1;

		for(var i = 0; i < this.skillNames.length; i++){
			if(this.skillNames[i].indexOf(skill) != -1){
				index = i;
			}
		}

		if(index != -1){
			if($.isNumeric(this.skillNames[index].charAt(this.skillNames[index].length-1))){
				return parseInt(this.skillNames[index].charAt(this.skillNames[index].length-1));
			}
			else{
				return 1;
			}
		}
		else{
			return 0;
		}
	}

	this.hasExactly = function(skill){
		//finds if hero has a skill with an exact name
		//returns true if found
		for(var i = 0; i < this.skillNames.length; i++){
			if(this.skillNames[i] == skill){
				return true;
			}
		}

		return false;
	}

	this.resetCharge = function(){
		//resets charge based on weapon
		if(this.has("Killing Edge") || this.has("Killer Axe") || this.has("Killer Lance") || this.has("Mystletainn") || this.has("Hauteclere") || this.has("Killer Bow")){
			this.charge = 1;
		}
		else if(this.has("Raudrblade") || this.has("Lightning Breath") || this.has("Blarblade") || this.has("Gronnblade")){
			this.charge = -1;
		}
		else{
			this.charge = 0;
		}
	}

	//Set charge at beginning
	this.resetCharge();
	this.charge += this.precharge;

	if(this.has("Quickened Pulse")){
		this.charge++;
	}

	this.threaten = function(enemy){
		//Thhhhhhhhrreats!
		var skillName = "";
		var threatDebuffs = getBlankBuffStats();
		var skillNames = [];

		//Only do ploys if not facing ranged diagonally-oriented asshats
		if(enemy.range == "melee" || options.ployBehavior != "Diagonal"){
			if(this.res > enemy.res){
				if(this.has("Atk Ploy")){
					threatDebuffs.atk = Math.min(threatDebuffs.atk,-this.has("Atk Ploy")-2);
					skillNames.push(data.skills[this.cIndex].name);
				}
				if(this.has("Def Ploy")){
					threatDebuffs.def = Math.min(threatDebuffs.def,-this.has("Def Ploy")-2);
					skillNames.push(data.skills[this.cIndex].name);
				}
			}

			if(this.has("Panic Ploy") && this.hp > enemy.hp + 6 - this.has("Panic Ploy") * 2){
				var skillName = data.skills[this.cIndex].name;
				enemy.panicked = true;
				this.battle.fightText += this.name + " activates " + skillName + ", inflicting panic on " + enemy.name + ".<br>";
			}
		}

		if(this.has("Threaten Atk")){
			threatDebuffs.atk = Math.min(threatDebuffs.atk,-this.has("Threaten Atk")-2);
			skillNames.push(data.skills[this.cIndex].name);
		}
		if(this.has("Fensalir")){
			threatDebuffs.atk = Math.min(threatDebuffs.atk,-4);
			skillNames.push("Fensalir");
		}

		if(this.has("Threaten Spd")){
			threatDebuffs.spd = Math.min(threatDebuffs.spd,-this.has("Threaten Spd")-2);
			skillNames.push(data.skills[this.cIndex].name);
		}

		if(this.has("Threaten Def")){
			threatDebuffs.def = Math.min(threatDebuffs.def,-this.has("Threaten Def")-2);
			skillNames.push(data.skills[this.cIndex].name);
		}
		if(this.has("Eckesachs")){
			threatDebuffs.def = Math.min(threatDebuffs.def,-4);
			skillNames.push("Eckesachs");
		}

		if(this.has("Threaten Res")){
			threatDebuffs.res = Math.min(threatDebuffs.res,-this.has("Threaten Res")-2);
			skillNames.push(data.skills[this.cIndex].name);
		}

		if(skillNames.length > 0){
			var statChanges = [];
			for(var stat in threatDebuffs){
				if(threatDebuffs[stat] < Math.min(enemy.debuffs[stat], enemy.combatDebuffs[stat])){
					enemy.combatDebuffs[stat] = threatDebuffs[stat];
					statChanges.push(stat + " " + threatDebuffs[stat]);
				}
			}

			if(statChanges.length > 0){
				this.battle.fightText += this.name + " has turn-start debuffing skills: " + skillNames.join(", ") + ". Effect on " + enemy.name + ": " + statChanges.join(", ") + "<br>";
			}
		}

			
	}

	this.renew = function(turn){
		var renewalTurn = 0;
		if(this.has("Renewal")){
			renewalTurn = 5 - this.has("Renewal");
		}
		if(this.has("Falchion") && renewalTurn > 3){
			renewalTurn = 3;
		}

		if(renewalTurn != 0){
			if(turn % renewalTurn == 0){
				var renewalHp = 10;
				if(this.hp + renewalHp > this.maxHp){
					renewalHp = this.maxHp - this.hp;
				}
				this.hp += renewalHp;
				this.battle.fightText += "Renewal: " + this.name + " heals " + renewalHp + "HP.<br>";
			}
		}		
	}

	this.defiant = function(){
		//All defiant sklls trigger at or below 50% HP
		if(this.hp / this.maxHp <= 0.5){
			var skillName = "";

			var defiantAtk = 0;
			if(this.has("Defiant Atk")){
				defiantAtk = this.has("Defiant Atk") * 2 + 1;
				skillName = data.skills[this.aIndex].name;
			}
			if(this.has("Folkvangr")){
				if(defiantAtk<5){
					defiantAtk = 5;
					skillName = data.skills[this.weaponIndex].name;
				}
			}
			if(defiantAtk > this.combatBuffs.atk){
				this.combatBuffs.atk = defiantAtk;
				this.battle.fightText += this.name + " activates " + skillName + " for +" + defiantAtk + " atk.<br>";
			}

			var defiantSpd = 0;
			if(this.has("Defiant Spd")){
				defiantSpd = this.has("Defiant Spd") * 2 + 1;
				skillName = data.skills[this.aIndex].name;
			}
			if(defiantSpd > this.combatBuffs.spd){
				this.combatBuffs.spd = defiantSpd;
				this.battle.fightText += this.name + " activates " + skillName + " for +" + defiantSpd + " spd.<br>";
			}

			var defiantDef = 0;
			if(this.has("Defiant Def")){
				defiantDef = this.has("Defiant Def") * 2 + 1;
				skillName = data.skills[this.aIndex].name;
			}
			if(defiantDef > this.combatBuffs.def){
				this.combatBuffs.def = defiantDef;
				this.battle.fightText += this.name + " activates " + skillName + " for +" + defiantDef + " def.<br>";
			}

			var defiantRes = 0;
			if(this.has("Defiant Res")){
				defiantRes = this.has("Defiant Res") * 2 + 1;
				skillName = data.skills[this.aIndex].name;
			}
			if(defiantRes > this.combatBuffs.res){
				this.combatBuffs.res = defiantRes;
				this.battle.fightText += this.name + " activates " + skillName + " for +" + defiantRes + " res.<br>";
			}
		}
		
	}

	//For buffs that act like spur and stack
	//Must be passed enemy for Earth Boost
	this.startCombatSpur = function(enemy){
		var skillNames = [];
		var boost = {atk:0,spd:0,def:0,res:0};

		//Full health at combat start spurs
		if(this.combatStartHp / this.maxHp >= 1){
			if(this.has("Ragnarok")){
				//Does this take effect when defending?
				boost.atk += 5;
				boost.spd += 5;
				skillNames.push("Ragnarok");
			}

			if(this.has("Seashell") || this.has("Refreshing Bolt") || this.has("Deft Harpoon") || this.has("Melon Crusher")){
				this.combatSpur.atk += 2;
				this.combatSpur.spd += 2;
				this.combatSpur.def += 2;
				this.combatSpur.res += 2;
				skillNames.push(data.skills[this.weaponIndex].name);
			}
		}

		//Enemy full health at combat start spurs
		if(enemy.combatStartHp / enemy.maxHp >= 1){
			if(this.has("Regal Blade")){
				boost.atk += 2;
				boost.spd += 2;
				skillNames.push("Regal Blade");
			}
		}

		//More HP than enemy spurs
		if(this.hp >= enemy.hp + 3){
			if(this.has("Earth Boost")){
				boost.def += this.has("Earth Boost") * 2;
				skillNames.push(data.skills[this.aIndex].name);
			}
			if(this.has("Wind Boost")){
				boost.spd += this.has("Wind Boost") * 2;
				skillNames.push(data.skills[this.aIndex].name);
			}
			if(this.has("Fire Boost")){
				buffVal = this.has("Fire Boost") * 2;
				skillName = data.skills[this.aIndex].name;
				this.combatSpur.atk += buffVal;
				this.battle.fightText += this.name + " gets +" + buffVal + " atk from having >=3 more hp than " + enemy.name + " with " + skillName + ".<br>";
			}
		}

		//Less than half health spurs
		if(this.hp / this.maxHp <= 0.5){
			if(this.has("Tyrfing")){
				boost.def += 4;
				skillNames.push("Tyrfing");
			}
		}

		//Initiator spurs
		if(this.initiator){
			if(this.has("Death Blow")){
				boost.atk += this.has("Death Blow") * 2;
				skillNames.push(data.skills[this.aIndex].name);
			}
			if(this.has("Swift Sparrow")){
				buffVal = this.has("Swift Sparrow") * 2;
				boost.atk += buffVal;
				boost.spd += buffVal;
				skillNames.push(data.skills[this.aIndex].name);
			}
			if(this.has("Sturdy Blow")){
				boost.def += this.has("Sturdy Blow") * 2;
				skillNames.push(data.skills[this.aIndex].name);
			}
			if(this.has("Durandal")){
				boost.atk += 4;
				skillNames.push("Durandal");
			}
			if(this.has("Darting Blow")){
				boost.spd += this.has("Darting Blow") * 2;
				skillNames.push(data.skills[this.aIndex].name);
			}
			if(this.has("Yato")){
				boost.spd += 4;
				skillNames.push("Yato");
			}
			if(this.has("Armored Blow")){
				boost.def += this.has("Armored Blow") * 2;
				skillNames.push(data.skills[this.aIndex].name);
			}
			if(this.has("Tyrfing") && this.hp / this.maxHp <= 0.5){
				boost.def += 4;
				skillNames.push("Tyrfing");
			}
			if(this.has("Warding Blow")){
				boost.res += this.has("Warding Blow") * 2;
				skillNames.push(data.skills[this.aIndex].name);
			}
			if(this.has("Parthia")){
				boost.res += 4;
				skillNames.push("Parthia");
			}
		}

		//Defense spurs
		if(!this.initiator){

			//Ranged defense spurs
			if(enemy.range == "ranged"){
				if(this.has("Distant Def")){
					buffVal = this.has("Distant Def") * 2;
					boost.def += buffVal;
					boost.res += buffVal;
					skillNames.push(data.skills[this.aIndex].name);
				}
			}

			//Melee defense spurs
			if(enemy.range == "melee"){
				if(this.has("Close Def")){
					buffVal = this.has("Distant Def") * 2;
					boost.def += buffVal;
					boost.res += buffVal;
					skillNames.push(data.skills[this.aIndex].name);
				}
			}

			if(this.has("Binding Blade") || this.has("Naga")){
				boost.def += 2;
				boost.res += 2;
				skillNames.push(data.skills[this.weaponIndex].name);
			}
		}

		var boostStats = [];
		for(var stat in boost){
			if(boost[stat] > 0){
				this.combatSpur[stat] += boost[stat];
				boostStats.push("+" + boost[stat] + " " + stat);
			}
		}

		if(boostStats.length > 0){
			this.battle.fightText += this.name + " gains " + boostStats.join(", ") + " from " + skillNames.join(", ") + ".<br>";
		}		
	}

	this.postCombatDamage = function(enemy){
		var skillNames = [];
		var dmg = 0;

		//Poison - only if initiator
		if(enemy.initiator){
			if(enemy.has("Poison Strike")){
				dmg += enemy.has("Poison Strike")*3+1;
				skillNames.push(data.skills[enemy.bIndex].name);
			}
			if(enemy.has("Deathly Dagger")){
				dmg += 7;
				skillNames.push("Deathly Dagger");
			}
		}

		//Pain - every combat where enemy did attack
		if(enemy.didAttack){
			if(enemy.has("Pain")){
				dmg += 10;
				skillNames.push("Pain");
			}
		}

		//Damage after combat where user did attack
		if(this.didAttack){
			//Damage only when 100% HP
			if(this.combatStartHp / this.maxHp >= 1){
				if(this.has("Ragnarok")){
					dmg += 5;
					skillNames.push("Ragnarok");
				}

				if(this.has("Seashell") || this.has("Refreshing Bolt") || this.has("Deft Harpoon") || this.has("Melon Crusher")){
					dmg += 2;
					skillNames.push(data.skills[this.weaponIndex].name);
				}
			}
		}

		//Fury - every combat
		if(this.has("Fury")){
			dmg += this.has("Fury") * 2;
			skillNames.push(data.skills[this.aIndex].name);
		}

		if(this.has("Embla's Ward")){
			dmg = 0;
		}
		if(dmg > 0){
			if(this.hp - dmg <= 0){
				dmg = this.hp - 1;
			}
			this.hp -= dmg;
			this.battle.fightText += this.name + " takes " + dmg + " damage after combat from " + skillNames.join(", ") + ".<br>";
		}		
	}

	this.seal = function(enemy){
		var skillName = "";

		var sealAtk = 0;
		if(this.has("Seal Atk")){ //Will count for seal atk speed as well
			sealAtk = -this.has("Seal Atk") * 2 - 1;
			skillName = data.skills[this.bIndex].name;
		}
		if(this.has("Fear") && sealAtk > -6){
			sealAtk = -6;
			skillName = data.skills[this.weaponIndex].name;
		}
		if(sealAtk < enemy.combatDebuffs.atk){
			enemy.combatDebuffs.atk = sealAtk;
			this.battle.fightText += this.name + " lowers " + enemy.name + "'s atk by " + (-sealAtk) + " after combat with " + skillName + ".<br>";
		}

		var sealSpd = 0;
		if(this.has("Seal Spd")){
			sealSpd = -this.has("Seal Spd") * 2 - 1;
			skillName = data.skills[this.bIndex].name;
		}
		if(this.has("Seal Atk Spd")){
			sealSpd = -this.has("Seal Atk Spd") * 2 - 1;
			skillName = data.skills[this.bIndex].name;
		}
		if(this.has("Slow") && sealSpd > -6){
			sealSpd = -6;
			skillName = data.skills[this.weaponIndex].name;
		}
		if(sealSpd < enemy.combatDebuffs.spd){
			enemy.combatDebuffs.spd = sealSpd;
			this.battle.fightText += this.name + " lowers " + enemy.name + "'s spd by " + (-sealSpd) + " after combat with " + skillName + ".<br>";
		}

		var sealDef = 0;
		if(this.has("Seal Def")){
			sealDef = -this.has("Seal Def") * 2 - 1;
			skillName = data.skills[this.bIndex].name;
		}
		//Daggers only take effect if the unit performed an attack
		if(this.didAttack){
			if((this.hasExactly("Silver Dagger+") || this.hasExactly("Deathly Dagger") || this.hasExactly("Seashell+")) && sealDef > -7){
				sealDef = -7;
				skillName = data.skills[this.weaponIndex].name;
			}
			else if((this.hasExactly("Silver Dagger") || this.hasExactly("Rogue Dagger+") || this.hasExactly("Seashell")) && sealDef > -5){
				sealDef = -5;
				skillName = data.skills[this.weaponIndex].name;
			}
			else if((this.hasExactly("Iron Dagger") || this.hasExactly("Steel Dagger") || this.hasExactly("Rogue Dagger")) && sealDef > -3){
				sealDef = -3;
				skillName = data.skills[this.weaponIndex].name;
			}
			else if(this.hasExactly("Poison Dagger+") && sealDef > -6 && enemy.moveType == "infantry"){
				sealDef = -6;
				skillName = data.skills[this.weaponIndex].name;
			}
			else if(this.hasExactly("Poison Dagger") && sealDef > -4 && enemy.moveType == "infantry"){
				sealDef = -4;
				skillName = data.skills[this.weaponIndex].name;
			}
		}
		if(sealDef < enemy.combatDebuffs.def){
			enemy.combatDebuffs.def = sealDef;
			this.battle.fightText += this.name + " lowers " + enemy.name + "'s def by " + (-sealDef) + " after combat with " + skillName + ".<br>";
		}

		var sealRes = 0;
		if(this.has("Seal Res")){
			sealRes = -this.has("Seal Res") * 2 - 1;
			skillName = data.skills[this.bIndex].name;
		}
		//Daggers only take effect if the unit performed an attack
		if(this.didAttack){
			if((this.hasExactly("Silver Dagger+") || this.hasExactly("Deathly Dagger") || this.hasExactly("Seashell+")) && sealRes > -7){
				sealRes = -7;
				skillName = data.skills[this.weaponIndex].name;
			}
			else if((this.hasExactly("Silver Dagger") || this.hasExactly("Rogue Dagger+") || this.hasExactly("Seashell")) && sealRes > -5){
				sealRes = -5;
				skillName = data.skills[this.weaponIndex].name;
			}
			else if((this.hasExactly("Iron Dagger") || this.hasExactly("Steel Dagger") || this.hasExactly("Rogue Dagger")) && sealRes > -3){
				sealRes = -3;
				skillName = data.skills[this.weaponIndex].name;
			}
			else if(this.hasExactly("Poison Dagger+") && sealRes > -6 && enemy.moveType == "infantry"){
				sealRes = -6;
				skillName = data.skills[this.weaponIndex].name;
			}
			else if(this.hasExactly("Poison Dagger") && sealRes > -4 && enemy.moveType == "infantry"){
				sealRes = -4;
				skillName = data.skills[this.weaponIndex].name;
			}
		}
		if(sealRes < enemy.combatDebuffs.res){
			enemy.combatDebuffs.res = sealRes;
			this.battle.fightText += this.name + " lowers " + enemy.name + "'s res by " + (-sealRes) + " after combat with " + skillName + ".<br>";
		}		
	}

	this.postCombatBuff = function(){

		//Daggers only take effect if the unit performed an attack
		if(this.didAttack){
			var skillName = "";

			//Will need to split these up if there comes another thing which boosts def or res after combat
			var buffDef = 0;
			var buffRes = 0;
			if(this.hasExactly("Rogue Dagger+")){
				buffDef = 5;
				buffRes = 5;
				skillName = data.skills[this.weaponIndex].name;
			}
			else if(this.hasExactly("Rogue Dagger")){
				buffDef = 3;
				buffRes = 3;
				skillName = data.skills[this.weaponIndex].name;
			}

			if(buffDef > this.combatBuffs.def){
				this.combatBuffs.def = buffDef;
				this.battle.fightText += this.name + " gains " + buffDef + " def after combat from " + skillName + ".<br>";
			}
			if(buffRes > this.combatBuffs.res){
				this.combatBuffs.res = buffRes;
				this.battle.fightText += this.name + " gains " + buffRes + " res after combat from " + skillName + ".<br>";
			}
		}		
	}

	this.postCombatHeal = function(){

		if(this.initiator){
			var skillname = "";
			
			if(this.has("Blue Egg") || this.has("Green Egg") || this.has("Carrot Axe") || this.has("Carrot Lance")){
				skillName = data.skills[this.weaponIndex].name;
				var healAmount = 4;
				if(this.maxHp - this.hp < healAmount){
					healAmount = this.maxHp - this.hp;
				}
				if(healAmount > 0){
					this.hp += healAmount;
					this.battle.fightText += this.name + " heals " + healAmount + " hp with " + skillName + ".<br>";
				}
			}
		}		
	}

	this.getEffectiveStat = function(stat){
		var effStat = this[stat];
		effStat += Math.min(this.debuffs[stat],this.combatDebuffs[stat]);
		effStat += this.spur[stat] + this.combatSpur[stat];
		if(this.panicked){
			effStat -= Math.max(this.buffs[stat],this.combatBuffs[stat]);
		}
		else{
			effStat += Math.max(this.buffs[stat],this.combatBuffs[stat]);
			//blade tomes add atk
			var bladeAtk = 0;
			if(hasBlade(this)){
				bladeAtk = Math.max(this.buffs.atk,this.combatBuffs.atk) + Math.max(this.buffs.spd,this.combatBuffs.spd) + Math.max(this.buffs.def,this.combatBuffs.def) + Math.max(this.buffs.res,this.combatBuffs.res);
				console.log("Adding blade..." + bladeAtk);
				effStat += bladeAtk;
			}
		}
		return effStat;
	}

	this.getAllEffectiveStats = function(){
		var effStats = {};
		data.buffStats.forEach(function(stat){
			effStats[stat] = thisAlias.getEffectiveStat(stat);
		});
		return effStats;
	}

	this.isSpecialReady = function(){
		return this.specialIndex!=-1 && data.skills[this.specialIndex].charge <= this.charge;
	}

	this.getAOEmult = function(){
		if(this.has("Rising Thunder") || this.has("Rising Wind") || this.has("Rising Light") || this.has("Rising Flame") || 
		this.has("Growing Thunder") || this.has("Growing Wind") || this.has("Growing Light") || this.has("Growing Flame")){
			return 1;
		}
		else if(this.has("Blazing Thunder") || this.has("Blazing Wind") || this.has("Blazing Light") || this.has("Blazing Flame")){
			return 1.5;
		}
		else{
			return 0;
		}
	}

	this.getExtraWeaponAdvantage = function(enemy){
		//Extra weapon advantage is limited to 0.2 more (doesn't stack)
		var extraWeaponAdvantage = 0;
		if(this.has("Ruby Sword") || this.has("Sapphire Lance") || this.has("Emerald Axe") || enemy.has("Ruby Sword") || enemy.has("Sapphire Lance") || enemy.has("Emerald Axe")){
			extraWeaponAdvantage = 0.2;
		}
		else{
			if(this.has("Triangle Adept")){
				extraWeaponAdvantage = 0.05 + 0.05 * this.has("Triangle Adept");
			}
			if(enemy.has("Triangle Adept")){
				extraWeaponAdvantage = Math.max(extraWeaponAdvantage, 0.05 + 0.05 * enemy.has("Triangle Adept"));
			}
		}	
		return extraWeaponAdvantage;
	}

	this.getWeaponAdvantage = function(enemy){
		//Check weapon advantage
		//0 is no advantage, 1 is attacker advantage, -1 is defender advantage
		var weaponAdvantage = 0;

		if((enemy.color=="green"&&this.color=="red")||(enemy.color=="red"&&this.color=="blue")||(enemy.color=="blue"&&this.color=="green")){
			weaponAdvantage = 1;
		}
		else if(enemy.color=="gray" && (this.has("Raudrraven") || this.has("Blarraven") || this.has("Gronnraven"))){
			weaponAdvantage = 1;
		}
		else if((this.color=="green"&&enemy.color=="red")||(this.color=="red"&&enemy.color=="blue")||(this.color=="blue"&&enemy.color=="green")){
			weaponAdvantage = -1;
		}
		else if(this.color=="gray" && (enemy.has("Raudrraven") || enemy.has("Blarraven") || enemy.has("Gronnraven"))){
			weaponAdvantage = -1;
		}

		var extraWeaponAdvantage = this.getExtraWeaponAdvantage(enemy);

		var weaponAdvantageBonus = (0.2 + extraWeaponAdvantage) * weaponAdvantage;
		return weaponAdvantageBonus;
	}

	this.takeDamage = function(dmg,nonlethal){
		dmg = Math.max(dmg, 0);
		if(nonlethal){
			dmg = Math.min(dmg, this.hp - 1);
		}
		if(this.has("Embla's Ward")){
			dmg = 0;
		}

		this.hp -= dmg;
		if(this.hp < 0){
			this.overkill = 0 - this.hp;
			this.hp = 0;
		}
	}

	//Represents AOE damage occurring before battle
	this.doAOEDamage = function(enemy){
		if(this.isSpecialReady()){
			var AOEmult = this.getAOEmult();
			if(AOEmult > 0){

				if(typeof this.effStats == "undefined"){
					this.effStats = this.getAllEffectiveStats();
					console.warn("Effective stats were not defined for this before doing AOE damage");
				}
				if(typeof enemy.effStats == "undefined"){
					enemy.effStats = enemy.getAllEffectiveStats();
					console.warn("Effective stats were not defined for enemy before doing AOE damage");
				}

				var relevantDef = enemy.effStats.def;
				if(this.attackType=="magical"){
					relevantDef = enemy.effStats.res;
				}

				//AOE specials don't take spur into effect
				var AOEAtk = this.effStats.atk - this.spur.atk - this.combatSpur.atk;
				var AOEdamage = (AOEAtk - relevantDef) * AOEmult | 0;
				AOEDamage = Math.max(AOEDamage, 0)

				enemy.takeDamage(AOEDamage, true);
				this.battle.fightText += "Before combat, " + this.name + " hits with " + data.skills[this.specialIndex].name + " for " + AOEDamage + ".<br>";

				this.resetCharge();
			}
		}		
	}

	//represents one attack of combat
	this.doDamage = function(enemy,brave,AOE){
		//didAttack variable for checking daggers and pain
		this.didAttack = true;

		var enemyDefModifier = 0;
		var effectiveBonus = 1.0;
		var dmgMultiplier = 1.0;
		var dmgBoost = 0;
		var absorbPct = 0;

		if(typeof this.effStats == "undefined"){
			this.effStats = this.getAllEffectiveStats();
			console.warn("Effective stats were not defined for this before doing damage");
		}
		if(typeof enemy.effStats == "undefined"){
			enemy.effStats = enemy.getAllEffectiveStats();
			console.warn("Effective stats were not defined for enemy before doing damage");
		}

		var relevantDef = enemy.effStats.def;
		if(this.attackType=="magical"){
			relevantDef = enemy.effStats.res;
		}

		var offensiveSpecialActivated = false;

		if(this.isSpecialReady()){

			//special will fire if it's an attacking special
			if(this.has("Night Sky") || this.has("Glimmer")){
				dmgMultiplier = 1.5;
				offensiveSpecialActivated = true;
			}
			else if(this.has("Astra")){
				dmgMultiplier = 2.5;
				offensiveSpecialActivated = true;
			}
			else if(this.has("Dragon Gaze") || this.has("Draconic Aura")){
				//Works like Ignis and Glacies
				dmgBoost += this.effStats.atk * 0.3;
				offensiveSpecialActivated = true;
			}
			else if(this.has("Dragon Fang")){
				dmgBoost += this.effStats.atk * 0.5;
				offensiveSpecialActivated = true;
			}
			else if(this.has("Glowing Ember") || this.has("Bonfire")){
				dmgBoost += this.effStats.def/2;
				offensiveSpecialActivated = true;
			}
			else if(this.has("Ignis")){
				dmgBoost += this.effStats.def * 0.8;
				offensiveSpecialActivated = true;
			}
			else if(this.has("Daylight") || this.has("Noontime")){
				absorbPct = 0.3;
				offensiveSpecialActivated = true;
			}
			else if(this.hasExactly("Sol")){
				absorbPct = 0.5;
				offensiveSpecialActivated = true;
			}
			else if(this.has("New Moon") || this.has("Moonbow")){
				enemyDefModifier = -0.3;
				offensiveSpecialActivated = true;
			}
			else if(this.has("Luna")){
				enemyDefModifier = -0.5;
				offensiveSpecialActivated = true;
			}
			else if(this.has("Chilling Wind") || this.has("Iceberg")){
				dmgBoost += this.effStats.res/2;
				offensiveSpecialActivated = true;
			}
			else if(this.has("Glacies")){
				dmgBoost += this.effStats.res*0.8;
				offensiveSpecialActivated = true;
			}
			else if(this.has("Retribution") || this.has("Reprisal")){
				dmgBoost += (this.maxHp-this.hp)*0.3;
				offensiveSpecialActivated = true;
			}
			else if(this.has("Vengeance")){
				dmgBoost += (this.maxHp-this.hp)*0.5;
				offensiveSpecialActivated = true;
			}
			else if(this.has("Aether")){
				enemyDefModifier = -0.5;
				absorbPct = 0.5;
				offensiveSpecialActivated = true;
			}

			if(offensiveSpecialActivated){
				this.resetCharge();
				this.battle.fightText += this.name + " activates " + data.skills[this.specialIndex].name + ". ";

				if(this.has("Wo Dao")){
					dmgBoost += 10;
					this.battle.fightText += this.name + " gains 10 damage from Wo Dao. ";
					//Does damage boost on AOE skills take effect on attack or AOE?
				}
			}
		}
		
		var weaponAdvantageBonus = this.getWeaponAdvantage(enemy);
		
		if(weaponAdvantageBonus != 0){
			this.battle.fightText += this.name + "'s attack is multiplied by " + Math.round((1+weaponAdvantageBonus)*10)/10 + " because of weapon advantage. ";
		}

		//Check weapon effective against
		var effectiveBonus = getEffectiveBonus(this,enemy);

		if(effectiveBonus > 1 ){
			this.battle.fightText += this.name + "'s attack is multiplied by " + effectiveBonus + " from weapon effectiveness. ";
		}

		//Check damage reducing specials
		var defensiveSpecialActivated = false;
		var dmgReduction = 1.0;
		var miracle = false;
		if(enemy.specialIndex!=-1&&data.skills[enemy.specialIndex].charge<=enemy.charge){
			//gotta check range
			var anyRangeCounter = canAnyRangeCounter(this);

			if(this.range == "melee" || (!this.initiator && enemy.range == "melee" && anyRangeCounter)){
				if(enemy.has("Buckler") || enemy.has("Escutcheon")){
					dmgReduction = 0.7;
					defensiveSpecialActivated = true;
				}
				else if(enemy.has("Pavise")){
					dmgReduction = 0.5;
					defensiveSpecialActivated = true;
				}
			}
			else if(this.range == "ranged" || (!this.initiator && enemy.range == "ranged" && anyRangeCounter)){
				if(enemy.has("Holy Vestments") || enemy.has("Sacred Cowl")){
					dmgReduction = 0.7;
					defensiveSpecialActivated = true;
				}
				else if(enemy.has("Aegis")){
					dmgReduction = 0.5;
					defensiveSpecialActivated = true;
				}
			}

			if(enemy.has("Miracle") && enemy.hp > 1){
				miracle = true;
			}
		}

		if(defensiveSpecialActivated){
			if(dmgReduction < 1){
				this.battle.fightText += enemy.name + " multiplies damage by " + dmgReduction + " with " + data.skills[enemy.specialIndex].name + ". ";
			}
			enemy.resetCharge();
		}

		//Weapon mod for healers
		var weaponModifier = 1;
		if(this.weaponType == "staff"){
			//poor healers
			weaponModifier = 0.5;

			//But wait!
			if(this.has("Wrathful Staff")){
				if(this.combatStartHp / this.maxHp >= 1.5 + this.has("Wrathful Staff") * -0.5){
					weaponModifier = 1;
				}
			}
		}

		if(this.has("Absorb")){
			absorbPct = 0.5;
		}

		//Damage calculation from http://feheroes.wiki/Damage_Calculation
		//use bitwise or to truncate properly
		//Doing calculation in steps to see the formula more clearly
		var rawDmg = (this.effStats.atk*effectiveBonus | 0) + ((this.effStats.atk*effectiveBonus | 0)*weaponAdvantageBonus | 0) + (dmgBoost | 0);
		var reduceDmg = relevantDef + (relevantDef*enemyDefModifier | 0);
		var dmg = (rawDmg - reduceDmg)*weaponModifier | 0;
		dmg = (dmg*dmgMultiplier | 0) - (dmg*(1-dmgReduction) | 0);
		dmg = Math.max(dmg,0);
		if(enemy.has("Embla's Ward")){
			dmg = 0;
		}
		this.battle.fightText += this.name + " attacks " + enemy.name + " for <span class=\"bold\">" + dmg + "</span> damage.<br>";
		if(dmg > enemy.hp){
			if(miracle){
				dmg = enemy.hp - 1;
				defensiveSpecialActivated = true;
				enemy.resetCharge();
				this.battle.fightText += enemy.name + " survives with 1HP with Miracle.<br>";
			}
			else{
				enemy.overkill = dmg - enemy.hp;
				dmg = Math.min(dmg,enemy.hp);
			}
		}
		enemy.hp -= dmg;

		//add absorbed hp
		var absorbHp = dmg*absorbPct | 0;
		if(this.hp + absorbHp > this.maxHp){
			absorbHp = this.maxHp - this.hp;
		}
		this.hp += absorbHp;
		if(absorbHp > 0){
			this.battle.fightText += this.name + " absorbs " + absorbHp + ".<br>";
		}

		//Special charge does not increase if special was used on this attack
		if(!offensiveSpecialActivated){
			var heavyBlade = 0;
			if(this.has("Heavy Blade")){
				heavyBlade = this.has("Heavy Blade")*-2 + 7;
			}
			if(heavyBlade && this.effStats.atk - enemy.effStats.atk >= heavyBlade){
				this.charge++;
			}

			var guardThreshold = 0;
			if(enemy.has("Guard")){
				guardThreshold = 1.1 - enemy.has("Guard")*0.1;
			}
			if(guardThreshold && enemy.combatStartHp / enemy.maxHp >= guardThreshold){
				this.charge--;
			}

			this.charge++;
		}

		if(!defensiveSpecialActivated){
			var guardThreshold = 0;
			if(this.has("Guard")){
				guardThreshold = 1.1 - this.has("Guard")*0.1;
			}
			if(guardThreshold && this.combatStartHp / this.maxHp >= guardThreshold){
				enemy.charge--;
			}

			enemy.charge++;
		}

		//show hp
		//Make sure challenger is first and in blue
		if(this.challenger){
			this.battle.fightText += this.name + " <span class=\"blue\">" + this.hp + "</span> : " + enemy.name + " <span class=\"red\">" + enemy.hp + "</span><br>";
		}
		else{
			this.battle.fightText += enemy.name + " <span class=\"blue\">" + enemy.hp + "</span> : " + this.name + " <span class=\"red\">" + this.hp + "</span><br>";
		}
	

		//do damage again if brave weapon
		if(brave && enemy.hp > 0){
			this.battle.fightText += this.name + " attacks again with a brave weapon.<br>";
			this.doDamage(enemy);
		}		
	}

	//represents a full round of combat
	//enemy: The defending unit
	//galeforce: If true, is second attack of the turn
	this.attack = function(enemy, galeforce){

		var firstTurn = (this.battle.turn - options.startTurn == 0);
		this.initiator = true;
		enemy.initiator = false;
		enemy.didAttack = false;

		//Get relevant defense for simplified text output?
		var relevantDefType = "def";
		if(enemy.attackType=="magical"){
			relevantDefType = "res";
		}

		//Remove certain buffs
		this.combatBuffs = getBlankBuffStats();

		//Don't do any buff crap if it's the second move of a turn (galeforce)
		if(!galeforce){
			//Check self buffs (defiant skills)
			this.defiant();

			//check turn for renewal
			//Does renewal happen before defiant?
			this.renew(this.battle.turn);
			enemy.renew(this.battle.turn);

			//Check threaten if not first turn (unless startThreatened is on)
			if((options.threatenRule=="Both"||options.threatenRule=="Attacker") && firstTurn){
				enemy.threaten(this);
			}
			if((options.threatenRule=="Both"||options.threatenRule=="Defender") || !firstTurn){
				this.threaten(enemy);
			}
		}

		//Set after renewal
		this.combatStartHp = this.hp;
		enemy.combatStartHp = enemy.hp;

		//Check combat effects
		this.combatSpur = getBlankBuffStats();
		enemy.combatSpur = getBlankBuffStats();

		this.startCombatSpur(enemy);
		enemy.startCombatSpur(this);

		//Get effective stats after buffs
		this.effStats = this.getAllEffectiveStats();
		enemy.effStats = enemy.getAllEffectiveStats();

		//check for any-distance counterattack
		var anyRangeCounter = canAnyRangeCounter(enemy);

		//check for vantage before beginning combat
		var vantage = false;
		if(enemy.has("Vantage")){
			if(enemy.hp/enemy.maxHp <= .25 * enemy.has("Vantage")){
				vantage = true;
			}
		}

		//check for desperation before beginning combat
		var desperation = false;
		if(this.has("Desperation")){
			if(this.hp/this.maxHp <= .25 * this.has("Desperation")){
				desperation = true;
			}
		}
		if(this.has("Sol Katti") && this.hp/this.maxHp <= .5){
			desperation = true;
		}

		//Check for quick riposte
		var quickRiposte = false;
		if(enemy.has("Quick Riposte")){
			if(enemy.hp/enemy.maxHp >= 1 - 0.1 * enemy.has("Quick Riposte")){
				quickRiposte = true;
			}
		}
		if(enemy.has("Armads") && enemy.hp/enemy.maxHp >= .8){
			quickRiposte = true;
		}

		//Check for brash assault
		var brashAssault = false;
		if(this.has("Brash Assault") && (this.range==enemy.range || anyRangeCounter)){
			if(this.hp/this.maxHp <= .2 + this.has("Brash Assault") * 0.1){
				brashAssault = true;
			}
		}

		//Check for wary fighter
		//Wary fighter can come from either unit
		//But some interactions apparently depend on who has it
		var waryFighter = false;
		var thisWaryFighter = false;
		var enemyWaryFighter = false;
		if(this.has("Wary Fighter")){
			if(this.hp/this.maxHp >= 1.1 - 0.2 * this.has("Wary Fighter")){
				waryFighter = true;
				thisWaryFighter = true;
			}
		}
		if(enemy.has("Wary Fighter")){
			if(enemy.hp/enemy.maxHp >= 1.1 - 0.2 * enemy.has("Wary Fighter")){
				waryFighter = true;
				enemyWaryFighter = true;
			}
		}

		//check for brave
		//brave will be passed to this.doDamage
		var brave = isBrave(this);

		//check for breaker skills
		var thisBroken = isBrokenBy(this, enemy);
		var enemyBroken = isBrokenBy(enemy, this);

		//Check for firesweep
		var firesweep = false;
		if(this.has("Firesweep")){
			firesweep = true;
		}
		if(enemy.has("Firesweep")){
			firesweep = true;
		}

		//check for other sweep
		var sweepSpd = 0;
		var windsweep = false;
		if(this.has("Windsweep") && data.physicalWeapons.indexOf(enemy.weaponType) != -1){
			windsweep = true;
			sweepSpd = this.has("Windsweep")*-2 + 7;
		}

		var watersweep = false;
		if(this.has("Watersweep") && data.magicalWeapons.indexOf(enemy.weaponType) != -1){
			watersweep = true;
			sweepSpd = this.has("Watersweep")*-2 + 7;
		}

		var enemySwept = false;
		if(sweepSpd && this.effStats.spd-enemy.effStats.spd >= sweepSpd){
			enemySwept = true;
		}
		if(firesweep){
			enemySwept = true;
		}

		//Do AOE damage
		this.doAOEDamage(enemy);

		var thisCanAttack = true;
		var thisFollowUp = false;
		var enemyCanCounter = false;
		var enemyFollowUp = false;

		//I split up the follow-up rules to be less confusing, so there are extra computations
		var preventEnemyFollow = false;
		var preventThisFollow = false;
		var enemyAutoFollow = false;
		var thisAutoFollow = false;
		var thisOutspeeds = false;
		var enemyOutspeeds = false;

		if(waryFighter){
			preventEnemyFollow = true;
			preventThisFollow = true;
		}
		if(thisBroken){
			preventThisFollow = true;
			enemyAutoFollow = true;
		}
		if(enemyBroken){
			preventEnemyFollow = true;
			thisAutoFollow = true;
		}
		if(brashAssault){
			thisAutoFollow = true;
		}
		if(quickRiposte){
			enemyAutoFollow = true;
		}
		if(windsweep || watersweep){
			preventThisFollow = true;
		}
		if(this.effStats.spd-enemy.effStats.spd >= 5){
			thisOutspeeds = true;
		}
		else if(this.effStats.spd-enemy.effStats.spd <= -5){
			enemyOutspeeds = true;
		}

		if(this.range==enemy.range || anyRangeCounter){
			enemyCanCounter = true;
			if(enemySwept){
				this.battle.fightText += enemy.name + " cannot counterattack because of a sweep skill.<br>";
				enemyCanCounter = false;
			}
			else if(enemy.lit){
				this.battle.fightText += enemy.name + " cannot counterattack because they're hella lit.<br>";
				enemyCanCounter = false;
			}
			else if(this.has("Dazzling Staff")){
				if(this.combatStartHp / this.maxHp >= 1.5 + this.has("Dazzling Staff") * -0.5){
					this.battle.fightText += this.name + " prevents " + enemy.name + " from counterattacking with Dazzling Staff.<br>";
					enemyCanCounter = false;
				}
			}
		}

		//Cancel things out
		if(preventThisFollow && thisAutoFollow){
			preventThisFollow = false;
			thisAutoFollow = false;
			this.battle.fightText += this.name + " is affected by conflicting follow-up skills, which cancel out.<br>";
		}
		if(thisAutoFollow){
			this.battle.fightText += this.name + " can make an automatic follow-up attack.<br>";
		}
		if(preventThisFollow){
			this.battle.fightText += this.name + " is prevented from making a follow-up attack.<br>";
		}
		
		if(enemyCanCounter){ //Don't show this text if the enemy can't counter anyway
			if(preventEnemyFollow && enemyAutoFollow){
				preventEnemyFollow = false;
				enemyAutoFollow = false;
				this.battle.fightText += enemy.name + " is affected by conflicting follow-up skills, which cancel out.<br>";
			}
			if(enemyAutoFollow){
				this.battle.fightText += enemy.name + " can make an automatic follow-up attack.<br>";
			}
			if(preventEnemyFollow){
				this.battle.fightText += enemy.name + " is prevented from making a follow-up attack.<br>";
			}
		}

		if((thisOutspeeds || thisAutoFollow) && !preventThisFollow){
			thisFollowUp = true;
		}
		if(enemyCanCounter && ((enemyOutspeeds || enemyAutoFollow) && !preventEnemyFollow)){
			enemyFollowUp = true;
		}

		//Do vantage damage
		//Enemy attacks
		if(vantage && enemyCanCounter){
			this.battle.fightText += enemy.name + " counterattacks first with vantage.<br>";
			enemy.doDamage(this);
		}

		//This attacks
		if(this.hp>0){
			this.doDamage(enemy,brave);
		}

		//Do desperation
		//This attacks
		if(this.hp > 0 && enemy.hp > 0 && desperation && thisFollowUp){
			this.battle.fightText += this.name + " attacks again immediately with desperation.<br>";
			this.doDamage(enemy,brave);
		}

		//Enemy attacks, either vantage follow-up or first attack
		if(enemy.hp > 0 && this.hp > 0 && (!vantage || (vantage && enemyFollowUp && enemyCanCounter))){
			if(enemyCanCounter){
				enemy.doDamage(this);
			}
		}

		//Don't do this attack if already did desperation
		//This attacks again
		if(this.hp>0 && enemy.hp > 0 && !desperation && thisFollowUp){
			this.doDamage(enemy,brave);
		}

		//Enemy attacks, non-vantage follow-up
		if(this.hp>0 && enemy.hp > 0 && !vantage && enemyCanCounter && enemyFollowUp){
			enemy.doDamage(this);
		}

		//Do post-combat damage to enemy if enemy isn't dead	
		if(enemy.hp>0){
			enemy.postCombatDamage(this);
		}

		//Do post-combat damage to this if this isn't dead
		if(this.hp>0){
			this.postCombatDamage(enemy);
		}

		//Remove debuffs - action done
		this.combatDebuffs = getBlankBuffStats();
		this.panicked = false;
		this.lit = false;

		//Do stuff if both aren't dead
		if(this.hp > 0 && enemy.hp > 0){
			//Apply post-combat debuffs (seal)
			this.seal(enemy);
			enemy.seal(this);

			//post-combat buffs
			//Rogue dagger works on enemy turn, but buffs are reset at beginning of player turn, so it only matters if a rogue gets attacked twice in one turn, which is possible with Galeforce
			this.postCombatBuff();
			enemy.postCombatBuff();
			this.postCombatHeal();

			//panic
			if(this.hasExactly("Panic") || this.has("Legion's Axe")){
				enemy.panicked = true;
				this.battle.fightText += this.name + " panics " + enemy.name + ".<br>";
			}
			if(enemy.hasExactly("Panic") || enemy.has("Legion's Axe")){
				this.panicked = true;
				this.battle.fightText += enemy.name + " panics " + this.name + ".<br>";
			}

			//candlelight
			if(this.has("Candlelight")){
				enemy.lit = true;
				this.battle.fightText += this.name + " inflicts " + enemy.name + " with an inability to make counterattacks.<br>";
			}
			if(enemy.has("Candlelight")){
				this.lit = true;
				this.battle.fightText += enemy.name + " inflicts " + this.name + " with an inability to make counterattacks.<br>";
			}

			//Finally, Galeforce!
			if(this.has("Galeforce") && data.skills[this.specialIndex].charge<=this.charge && options.useGaleforce){
				this.battle.fightText += this.name + " initiates again with Galeforce!<br>";
				this.resetCharge();
				this.attack(enemy,battle,true);
			}
		}
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//Calculation utility

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

function canAnyRangeCounter(hero){
	return hero.has("Close Counter") || hero.has("Distant Counter") || hero.has("Raijinto") || hero.has("Lightning Breath") || hero.has("Ragnell") || hero.has("Siegfried") || hero.has("Gradivus");
}

function isBrave(hero){
	return hero.has("Brave Sword") || hero.has("Brave Lance") || hero.has("Brave Axe") || hero.has("Brave Bow") || hero.has("Dire Thunder");
}

function isBrokenBy(hero, enemy){
	var breakLevel = 2; // pct hp threshold
	if(hero.weaponType=="sword" && enemy.has("Swordbreaker")){
		breakLevel = 1.1 - enemy.has("Swordbreaker") * 0.2;
	}
	else if(hero.weaponType=="lance" && enemy.has("Lancebreaker")){
		breakLevel = 1.1 - enemy.has("Lancebreaker") * 0.2;
	}
	else if(hero.weaponType=="axe" && enemy.has("Axebreaker")){
		breakLevel = 1.1 - enemy.has("Axebreaker") * 0.2;
	}
	else if(hero.weaponType=="redtome" && enemy.has("R Tomebreaker")){
		breakLevel = 1.1 - enemy.has("R Tomebreaker") * 0.2;
	}
	else if(hero.weaponType=="bluetome" && enemy.has("B Tomebreaker")){
		breakLevel = 1.1 - enemy.has("B Tomebreaker") * 0.2;
	}
	else if(hero.weaponType=="greentome" && enemy.has("G Tomebreaker")){
		breakLevel = 1.1 - enemy.has("G Tomebreaker") * 0.2;
	}
	else if(hero.weaponType=="bow" && enemy.has("Bowbreaker")){
		breakLevel = 1.1 - enemy.has("Bowbreaker") * 0.2;
	}
	else if(hero.weaponType=="dagger" && enemy.has("Daggerbreaker")){
		breakLevel = 1.1 - enemy.has("Daggerbreaker") * 0.2;
	}
	else if(hero.weaponType=="dagger" && enemy.has("Assassin's Bow")){
		breakLevel = 0;
	}

	return enemy.hp / enemy.maxHp >= breakLevel;
}

function getEffectiveBonus(hero,enemy){
	var effectiveBonus = 1;
	if(!isResistantToEffective(enemy)){
		var effectiveTypes = getEffectiveTypes(hero);
		for(var i = 0; i < effectiveTypes.length; i++){
			if(effectiveTypes[i] == enemy.moveType || effectiveTypes[i] == enemy.weaponType){
				effectiveBonus += 0.5; //assuming additive?
			}
		}		
	}
	return effectiveBonus;
}

function isResistantToEffective(hero){
	return hero.has("Svalinn Shield") || hero.has("Iote's Shield") || hero.has("Grani's Shield");
}

function getEffectiveTypes(hero){
	//Not currently possible to be effective against multiple types, but you never know
	var types = [];
	if(hero.has("Hammer") || hero.has("Armorslayer") || hero.has("Heavy Spear")){
		types.push("armored");
	}
	if(hero.has("Excalibur") || hero.weaponType=="bow"){
		types.push("flying");
	}
	if(hero.has("Poison Dagger")){
		types.push("infantry");
	}
	if(hero.has("Raudrwolf") || hero.has("Blarwolf") || hero.has("Gronnwolf")){
		types.push("cavalry");
	}
	if(hero.has("Falchion") || hero.has("Naga")){
		types.push("dragon");
	}

	return types;
}

function hasBlade(hero){
	return hero.has("Raudrblade") || hero.has("Blarblade") || hero.has("Gronnblade");
}

function getAttackTypeFromWeapon(weaponType){
	if(data.physicalWeapons.indexOf(weaponType) != -1){
		return "physical";
	}
	else if(data.magicalWeapons.indexOf(weaponType) != -1){
		return "magical";
	}
	else{
		return "unknown";
	}
}

function getColorFromWeapon(weaponType){
	if(weaponType == "sword" || weaponType == "redtome" || weaponType == "reddragon"){
		return "red";
	}
	else if(weaponType == "lance" || weaponType == "bluetome" || weaponType == "bluedragon"){
		return "blue";
	}
	else if(weaponType == "axe" || weaponType == "greentome" || weaponType == "greendragon"){
		return "green";
	}
	else{
		return "gray";
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

//Purely utility

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

function addStats(stats1, stats2){
	var newStats = {};
	for(var key in stats1){
		if(typeof stats2[key] != "undefined"){
			newStats[key] = stats1[key] + stats2[key];
		}
	}
	return newStats;
}

//Gets highest magnitude (absolute value)
function maxMagStats(stats1, stats2){
	var newStats = {};
	for(var key in stats1){
		if(typeof stats2[key] != "undefined"){
			if(Math.abs(stats1[key]) > Math.abs(stats2[key])){
				newStats[key] = stats1[key];
			}
			else{
				newStats[key] = stats2[key];
			}
		}
	}
	return newStats;
}

function capitalize(string){
	if(string.length > 0){
		return string.charAt(0).toUpperCase() + string.slice(1);
	}
	else{
		return string;
	}
}

function replaceRecursive(original,replace){
	for(var key in replace){
		if(typeof original[key] == "object"){
			replaceRecursive(original[key],replace[key]);
		}
		else{
			original[key] = replace[key];
		}
	}
}

function changeDataVar(dataVar,newVal){
	var dataSplit = dataVar.split(".");
	var parsedVar = window;
	for(var level = 0; level < dataSplit.length; level++){
		if(dataSplit[level] == "list"){
			//Replace list with list[i]
			//This won't be the last run
			parsedVar = parsedVar[dataSplit[level]][options.customEnemySelected];
		}
		else{
			if(level == dataSplit.length-1){
				//Last run - set the variable
				parsedVar[dataSplit[level]] = newVal;
			}
			else{
				parsedVar = parsedVar[dataSplit[level]];
			}
		}
		if(typeof parsedVar == "undefined"){
			break;
		}
	}
}

function beginsWith(fullString, substring){
	return (fullString.slice(0, substring.length) == substring);
}

function endsWith(fullString, substring){
	return (fullString.slice(-substring.length) == substring);
}

function getHtmlPrefix(hero){
	var htmlPrefix = "";
	if(hero.challenger){
		htmlPrefix = "challenger_";
	}
	else{
		if(hero.isFl){
			htmlPrefix = "enemies_";
		}
		else{
			htmlPrefix = "cl_enemy_";
		}
	}
	return htmlPrefix;
}

function getSkillIndexFromId(skillid){
	var index = -1;
	for(var i = 0; i < data.skills.length; i++){
		if(data.skills[i].skill_id == skillid){
			index = i;
			break;
		}
	}
	//console.log("Looked for index of skill id " + skillid + "; found at " + index);
	return index;
}

function getIndexFromName(name,dataList,slot){
	//Skill/hero array is sorted by name + slot! (only name in case of heroes)
	name = name.toLowerCase();
	slot = slot || "";

	var leftBound = 0;
	var rightBound = dataList.length - 1;
	var checkingIndex;
	var testName;
	var testSlot;
	var testIsS;
	var found = -1;
	do{
		checkingIndex = Math.round((rightBound - leftBound) / 2 + leftBound);
		testName = dataList[checkingIndex].name.toLowerCase();
		testSlot = dataList[checkingIndex].slot || "";
		if(testName + testSlot == name + slot){
			found = checkingIndex;
			break;
		}
		else if(testName + testSlot > name + slot){
			rightBound = checkingIndex - 1;
		}
		else{
			leftBound = checkingIndex + 1;
		}
	}
	while(leftBound <= rightBound);

	return found;
}



function getBlankStats(){
	return {"hp":0,"atk":0,"spd":0,"def":0,"res":0};
}

function getBlankBuffStats(){
	return {"atk":0,"spd":0,"def":0,"res":0};
}

function verifyNumberInput(element,min,max){
	//contrains number between two values and returns it
	newVal = parseInt($(element).val());
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

function getGrowthValue(growthLevel, rarity){
	try{
		return data.growths[rarity-1][growthLevel];
	}
	catch(e){
		return 0;
	}
}

function removeDiacritics (str) {
	//Copied from
	//https://stackoverflow.com/questions/18123501/replacing-accented-characters-with-plain-ascii-ones
	//ð added to d
	var defaultDiacriticsRemovalMap = [
		{'base':'A', 'letters':/[\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F]/g},
		{'base':'AA','letters':/[\uA732]/g},
		{'base':'AE','letters':/[\u00C6\u01FC\u01E2]/g},
		{'base':'AO','letters':/[\uA734]/g},
		{'base':'AU','letters':/[\uA736]/g},
		{'base':'AV','letters':/[\uA738\uA73A]/g},
		{'base':'AY','letters':/[\uA73C]/g},
		{'base':'B', 'letters':/[\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181]/g},
		{'base':'C', 'letters':/[\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E]/g},
		{'base':'D', 'letters':/[\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779]/g},
		{'base':'DZ','letters':/[\u01F1\u01C4]/g},
		{'base':'Dz','letters':/[\u01F2\u01C5]/g},
		{'base':'E', 'letters':/[\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E]/g},
		{'base':'F', 'letters':/[\u0046\u24BB\uFF26\u1E1E\u0191\uA77B]/g},
		{'base':'G', 'letters':/[\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E]/g},
		{'base':'H', 'letters':/[\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D]/g},
		{'base':'I', 'letters':/[\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197]/g},
		{'base':'J', 'letters':/[\u004A\u24BF\uFF2A\u0134\u0248]/g},
		{'base':'K', 'letters':/[\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2]/g},
		{'base':'L', 'letters':/[\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780]/g},
		{'base':'LJ','letters':/[\u01C7]/g},
		{'base':'Lj','letters':/[\u01C8]/g},
		{'base':'M', 'letters':/[\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C]/g},
		{'base':'N', 'letters':/[\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4]/g},
		{'base':'NJ','letters':/[\u01CA]/g},
		{'base':'Nj','letters':/[\u01CB]/g},
		{'base':'O', 'letters':/[\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C]/g},
		{'base':'OI','letters':/[\u01A2]/g},
		{'base':'OO','letters':/[\uA74E]/g},
		{'base':'OU','letters':/[\u0222]/g},
		{'base':'P', 'letters':/[\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754]/g},
		{'base':'Q', 'letters':/[\u0051\u24C6\uFF31\uA756\uA758\u024A]/g},
		{'base':'R', 'letters':/[\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782]/g},
		{'base':'S', 'letters':/[\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784]/g},
		{'base':'T', 'letters':/[\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786]/g},
		{'base':'TZ','letters':/[\uA728]/g},
		{'base':'U', 'letters':/[\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244]/g},
		{'base':'V', 'letters':/[\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245]/g},
		{'base':'VY','letters':/[\uA760]/g},
		{'base':'W', 'letters':/[\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72]/g},
		{'base':'X', 'letters':/[\u0058\u24CD\uFF38\u1E8A\u1E8C]/g},
		{'base':'Y', 'letters':/[\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE]/g},
		{'base':'Z', 'letters':/[\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762]/g},
		{'base':'a', 'letters':/[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/g},
		{'base':'aa','letters':/[\uA733]/g},
		{'base':'ae','letters':/[\u00E6\u01FD\u01E3]/g},
		{'base':'ao','letters':/[\uA735]/g},
		{'base':'au','letters':/[\uA737]/g},
		{'base':'av','letters':/[\uA739\uA73B]/g},
		{'base':'ay','letters':/[\uA73D]/g},
		{'base':'b', 'letters':/[\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253]/g},
		{'base':'c', 'letters':/[\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184]/g},
		{'base':'d', 'letters':/[\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A\u00F0]/g},
		{'base':'dz','letters':/[\u01F3\u01C6]/g},
		{'base':'e', 'letters':/[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/g},
		{'base':'f', 'letters':/[\u0066\u24D5\uFF46\u1E1F\u0192\uA77C]/g},
		{'base':'g', 'letters':/[\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F]/g},
		{'base':'h', 'letters':/[\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265]/g},
		{'base':'hv','letters':/[\u0195]/g},
		{'base':'i', 'letters':/[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/g},
		{'base':'j', 'letters':/[\u006A\u24D9\uFF4A\u0135\u01F0\u0249]/g},
		{'base':'k', 'letters':/[\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3]/g},
		{'base':'l', 'letters':/[\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747]/g},
		{'base':'lj','letters':/[\u01C9]/g},
		{'base':'m', 'letters':/[\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F]/g},
		{'base':'n', 'letters':/[\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5]/g},
		{'base':'nj','letters':/[\u01CC]/g},
		{'base':'o', 'letters':/[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/g},
		{'base':'oi','letters':/[\u01A3]/g},
		{'base':'ou','letters':/[\u0223]/g},
		{'base':'oo','letters':/[\uA74F]/g},
		{'base':'p','letters':/[\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755]/g},
		{'base':'q','letters':/[\u0071\u24E0\uFF51\u024B\uA757\uA759]/g},
		{'base':'r','letters':/[\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783]/g},
		{'base':'s','letters':/[\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B]/g},
		{'base':'t','letters':/[\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787]/g},
		{'base':'tz','letters':/[\uA729]/g},
		{'base':'u','letters':/[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/g},
		{'base':'v','letters':/[\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C]/g},
		{'base':'vy','letters':/[\uA761]/g},
		{'base':'w','letters':/[\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73]/g},
		{'base':'x','letters':/[\u0078\u24E7\uFF58\u1E8B\u1E8D]/g},
		{'base':'y','letters':/[\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF]/g},
		{'base':'z','letters':/[\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763]/g}
	];

	for(var i=0; i<defaultDiacriticsRemovalMap.length; i++) {
		str = str.replace(defaultDiacriticsRemovalMap[i].letters, defaultDiacriticsRemovalMap[i].base);
	}

	return str;
}

function getAllArrayIndices(array){
	var indexArray = [];
	for(var i = 0; i < array.length; i++){
		indexArray.push(i);
	}
	return indexArray;
}

function hideUpdateNotice(){
	$("#frame_updatenotice").fadeOut(300);
}

function doUpdateNotice(){
	//If localStorage is not supported, hopefully this just throws an error on this function and doesn't break anything else
	var currentUpdate = parseInt($("#frame_updatenotice").attr("data-update"));
	var lastUpdate = localStorage.getItem("lastUpdateShown") || 0;
	if(lastUpdate<currentUpdate){
		localStorage.setItem("lastUpdateShown",currentUpdate);
		//Don't show the notification until the page is well-loaded
		setTimeout(function(){
			$("#frame_updatenotice").fadeIn(1000);
		}, 1000);
	}
}