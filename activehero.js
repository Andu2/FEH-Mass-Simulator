//activeHero is a class for simulating a unit in a battle
//This is where most of the calculations happen
//heroIndex is the index of the hero represented
//challenger is true if challenger, false if enemy
function activeHero(index,challenger){
	//If challenger, index is for heroes[]
	//Otherwise, index is for enemyData[]

	this.combatBuffs = {"atk":0,"spd":0,"def":0,"res":0};
	this.combatDebuffs = {"atk":0,"spd":0,"def":0,"res":0};
	this.combatSpur = {"atk":0,"spd":0,"def":0,"res":0};

	this.skillNames = [];

	if(challenger){

		this.challenger = true;
		this.heroIndex = index;
		this.name = heroes[index].name;
		this.rarity = challengerRarity;
		this.merge = challengerMerge;

		this.weaponIndex = challengerWeapon;	
		this.specialIndex = challengerSpecial;
		this.aIndex = challengerA;
		this.bIndex = challengerB;
		this.cIndex = challengerC;
		this.sIndex = challengerS;

		this.buffs = challengerBuffs;
		this.debuffs = challengerDebuffs;
		this.spur = challengerSpur;

		this.maxHp = challengerHp;
		this.atk = challengerAtk;
		this.spd = challengerSpd;
		this.def = challengerDef;
		this.res = challengerRes;

		this.moveType = heroes[index].movetype;
		this.weaponType = heroes[index].weapontype;
		this.color = heroes[index].color;

		this.hp = Math.max(this.maxHp - challengerDamage,1);
		this.precharge = 0 + challengerPrecharge;
		
	}
	else{

		this.challenger = false;
		this.heroIndex = enemyData[index].index;
		this.name = enemyData[index].name;
		this.rarity = enemyRarity;
		this.merge = enemiesMerge;

		this.weaponIndex = enemyData[index].weapon;	
		this.specialIndex = enemyData[index].special;
		this.aIndex = enemyData[index].a;
		this.bIndex = enemyData[index].b;
		this.cIndex = enemyData[index].c;
		this.sIndex = enemyData[index].s;

		this.buffs = enemyBuffs;
		this.debuffs = enemyDebuffs;
		this.spur = enemySpur;

		this.maxHp = enemyData[index].hp;
		this.atk = enemyData[index].atk;
		this.spd = enemyData[index].spd;
		this.def = enemyData[index].def;
		this.res = enemyData[index].res;

		this.moveType = enemyData[index].movetype;
		this.weaponType = enemyData[index].weapontype;
		this.color = enemyData[index].color;

		this.hp = Math.max(this.maxHp - enemyDamage,1);
		this.precharge = 0 + enemyPrecharge;

	}

	//Make a list of skill names for easy reference
	if(this.weaponIndex != -1){
		this.skillNames.push(skills[this.weaponIndex].name);
	}
	if(this.specialIndex != -1){
		this.skillNames.push(skills[this.specialIndex].name);
	}
	if(this.aIndex != -1){
		this.skillNames.push(skills[this.aIndex].name);
	}
	if(this.bIndex != -1){
		this.skillNames.push(skills[this.bIndex].name);
	}
	if(this.cIndex != -1){
		this.skillNames.push(skills[this.cIndex].name);
	}
	if(this.sIndex != -1){
		this.skillNames.push(skills[this.sIndex].name);
	}

	//Categorize weapon
	if(rangedWeapons.indexOf(this.weaponType)!=-1){
		this.range = "ranged";
	}
	else{
		this.range = "melee";
	}
	if(physicalWeapons.indexOf(this.weaponType)!=-1){
		this.attackType = "physical";
	}
	else{
		this.attackType = "magical";
	}

	this.charge = 0;
	this.initiator = false;
	this.panicked = false;
	this.didAttack = false;

	this.has = function(skill){
		//finds if hero has a skill that includes the string given
		//returns 1 if found, or a number 1-3 if level of skill is found
		//For exact matches, see "hasExactly"
		var index = -1;

		for(var i = 0; i < this.skillNames.length; i++){
			if(this.skillNames[i].includes(skill)){
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

	this.threaten = function(enemy){
		//Thhhhhhhhrreats!
		var threatenText = "";
		var skillName = "";

		var debuffAtk = 0;
		if(this.has("Threaten Atk")){
			debuffAtk = -this.has("Threaten Atk")-2;
			skillName = skills[this.cIndex].name;
		}
		if(this.has("Fensalir")){
			if(debuffAtk > -4){
				debuffAtk = -4;
				skillName = skills[this.weaponIndex].name;
			}
		}
		if(debuffAtk < enemy.combatDebuffs.atk){
			enemy.combatDebuffs.atk = debuffAtk;
			threatenText += this.name + " activates " + skillName + ", giving " + enemy.name + " " + enemy.combatDebuffs.atk + " atk.<br>";
		}

		var debuffSpd = 0;
		if(this.has("Threaten Spd")){
			debuffSpd = -this.has("Threaten Spd")-2;
			skillName = skills[this.cIndex].name;
		}
		if(debuffSpd < enemy.combatDebuffs.spd){
			enemy.combatDebuffs.spd = debuffSpd;
			threatenText += this.name + " activates " + skillName + ", giving " + enemy.name + " " + enemy.combatDebuffs.spd + " spd.<br>";
		}

		var debuffDef = 0;
		if(this.has("Threaten Def")){
			debuffDef = -this.has("Threaten Def")-2;
			skillName = skills[this.cIndex].name;
		}
		if(this.has("Eckesachs")){
			if(debuffDef > -4){
				debuffDef = -4;
				skillName = skills[this.weaponIndex].name;
			}
		}
		if(debuffDef < enemy.combatDebuffs.def){
			enemy.combatDebuffs.def = debuffDef;
			threatenText += this.name + " activates " + skillName + ", giving " + enemy.name + " " + enemy.combatDebuffs.def + " def.<br>";
		}

		var debuffRes = 0;
		if(this.has("Threaten Res")){
			debuffRes = -this.has("Threaten Res")-2;
			skillName = skills[this.cIndex].name;
		}
		if(debuffRes < enemy.combatDebuffs.res){
			enemy.combatDebuffs.res = debuffRes;
			threatenText += this.name + " activates " + skillName + ", giving " + enemy.name + " " + enemy.combatDebuffs.res + " res.<br>";
		}

		return threatenText;	
	}

	this.renew = function(turn){
		var renewText = "";
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
				renewText += "Renewal: " + this.name + " heals " + renewalHp + "HP.<br>";
			}
		}

		return renewText;
	}

	this.defiant = function(){
		var defiantText = "";

		//All defiant sklls trigger at or below 50% HP
		if(this.hp / this.maxHp <= 0.5){
			var skillName = "";

			var defiantAtk = 0;
			if(this.has("Defiant Atk")){
				defiantAtk = this.has("Defiant Atk") * 2 + 1;
				skillName = skills[this.aIndex].name;
			}
			if(this.has("Folkvangr")){
				if(defiantAtk<5){
					defiantAtk = 5;
					skillName = skills[this.weaponIndex].name;
				}
			}
			if(defiantAtk > this.combatBuffs.atk){
				this.combatBuffs.atk = defiantAtk;
				defiantText += this.name + " activates " + skillName + " for +" + defiantAtk + " atk.<br>";
			}

			var defiantSpd = 0;
			if(this.has("Defiant Spd")){
				defiantSpd = this.has("Defiant Spd") * 2 + 1;
				skillName = skills[this.aIndex].name;
			}
			if(defiantSpd > this.combatBuffs.spd){
				this.combatBuffs.spd = defiantSpd;
				defiantText += this.name + " activates " + skillName + " for +" + defiantSpd + " spd.<br>";
			}

			var defiantDef = 0;
			if(this.has("Defiant Def")){
				defiantDef = this.has("Defiant Def") * 2 + 1;
				skillName = skills[this.aIndex].name;
			}
			if(defiantDef > this.combatBuffs.def){
				this.combatBuffs.def = defiantDef;
				defiantText += this.name + " activates " + skillName + " for +" + defiantDef + " def.<br>";
			}

			var defiantRes = 0;
			if(this.has("Defiant Res")){
				defiantRes = this.has("Resiant Res") * 2 + 1;
				skillName = skills[this.aIndex].name;
			}
			if(defiantRes > this.combatBuffs.res){
				this.combatBuffs.res = defiantRes;
				defiantText += this.name + " activates " + skillName + " for +" + defiantRes + " res.<br>";
			}
		}
		return defiantText;
	}

	this.blow = function(){
		var blowText = "";
		var skillName = "";

		var blowAtk = 0;
		if(this.has("Death Blow")){
			blowAtk = this.has("Death Blow") * 2;
			skillName = skills[this.aIndex].name;
			this.combatSpur.atk += blowAtk;
			blowText += this.name + " gets +" + blowAtk + " atk from initiating with " + skillName + ".<br>";
		}
		if(this.has("Swift Sparrow")){
			blowAtk = this.has("Swift Sparrow") * 2;
			skillName = skills[this.aIndex].name;
			this.combatSpur.atk += blowAtk;
			blowText += this.name + " gets +" + blowAtk + " atk from initiating with " + skillName + ".<br>";
		}
		if(this.has("Durandal")){
			this.combatSpur.atk += 4;
			blowText += this.name + " gets +4 atk from initiating with Durandal.<br>";
		}

		var blowSpd = 0;
		if(this.has("Darting Blow")){
			blowSpd = this.has("Darting Blow") * 2;
			skillName = skills[this.aIndex].name;
			this.combatSpur.spd += blowSpd;
			blowText += this.name + " gets " + blowSpd + " spd from initiating with " + skillName + ".<br>";
		}
		if(this.has("Swift Sparrow")){
			blowSpd = this.has("Swift Sparrow") * 2;
			skillName = skills[this.aIndex].name;
			this.combatSpur.spd += blowSpd;
			blowText += this.name + " gets +" + blowSpd + " spd from initiating with " + skillName + ".<br>";
		}
		if(this.has("Yato")){
			this.combatSpur.spd += 4;
			blowText += this.name + " gets +4 spd from initiating with Yato.<br>";
		}

		var blowDef = 0;
		if(this.has("Armored Blow")){
			blowDef = this.has("Armored Blow") * 2;
			skillName = skills[this.aIndex].name;
			this.combatSpur.def += blowDef;
			blowText += this.name + " gets " + blowDef + " def from initiating with " + skillName + ".<br>";
		}
		if(this.has("Tyrfing") && this.hp / this.maxHp <= 0.5){
			this.combatSpur.def += 4;
			blowText += this.name + " gets +4 def from Tyrfing.<br>";
		}

		var blowRes = 0;
		if(this.has("Warding Blow")){
			blowRes = this.has("Warding Blow") * 2;
			skillName = skills[this.aIndex].name;
			this.combatSpur.res += blowRes;
			blowText += this.name + " gets " + blowRes + " res from initiating with " + skillName + ".<br>";
		}
		if(this.has("Parthia")){
			this.combatSpur.res += 4;
			blowText += this.name + " gets +4 res from initiating with Parthia.<br>";
		}

		return blowText;
	}

	this.defendBuff = function(relevantDefType){
		var defendBuffText = "";
		//Not actually going to limit text from relevantDefType, beccause res/def may always be relevant for special attacks
		if(this.has("Binding Blade") || this.has("Naga")){
			this.combatSpur.def += 2;
			this.combatSpur.res += 2;
			defendBuffText += this.name + " gets +2 def and res while defending with " + skills[this.weaponIndex].name + ".<br>";
		}
		if(this.has("Tyrfing") && this.hp / this.maxHp <= 0.5){
			this.combatSpur.def += 4;
			defendBuffText += this.name + " gets +4 def from Tyrfing.<br>";
		}

		return defendBuffText;
	}

	//poison only happens when the user initiates
	this.poisonEnemy = function(enemy){	
		var poisonEnemyText ="";
		var skillName = "";

		var poison = 0;
		if(this.has("Poison Strike")){
			poison = this.has("Poison Strike")*3+1;
			skillName = skills[this.bIndex].name;
			if(enemy.hp - poison <= 0){
				poison = enemy.hp - 1;
			}
			enemy.hp -= poison;
			poisonEnemyText += enemy.name + " takes " + poison + " damage after combat from " + skillName + ".<br>";
		}
		if(this.has("Deathly Dagger")){
			poison = 7;
			skillName = skills[this.weaponIndex].name;
			if(enemy.hp - poison <= 0){
				poison = enemy.hp - 1;
			}
			enemy.hp -= poison;
			poisonEnemyText += enemy.name + " takes " + poison + " damage after combat from " + skillName + ".<br>";
		}

		return poisonEnemyText;
	}

	//Pain and fury happen after every combat regardless of initiator
	//They could be put into one function, but separating them is easier to make sense of
	this.painEnemy = function(enemy){
		var painEnemyText = "";

		//Pain only takes place when the unit performs an attack in the round
		if(this.has("Pain") && this.didAttack){
			var painDmg = 10;
			if(enemy.hp - painDmg <= 0){
				painDmg = enemy.hp - 1;
			}
			enemy.hp -= painDmg;
			painEnemyText += enemy.name + " takes " + painDmg + " damage after combat from Pain.<br>";
		}

		return painEnemyText;
	}

	this.fury = function(){
		var furyText = "";

		var skillName = "";

		var furyDmg = 0;
		if(this.has("Fury")){
			furyDmg = this.has("Fury") * 2;
			skillName = skills[this.aIndex].name;
		}
		if(furyDmg > 0){
			if(this.hp - furyDmg <= 0){
				furyDmg = this.hp - 1;
			}
			this.hp -= furyDmg;
			furyText += this.name + " takes " + furyDmg + " damage after combat from " + skillName + ".<br>";
		}

		return furyText;
	}

	this.seal = function(enemy){
		var sealText = "";

		var skillName = "";

		var sealAtk = 0;
		if(this.has("Seal Atk")){
			sealAtk = -this.has("Seal Atk") * 2 - 1;
			skillName = skills[this.bIndex].name;
		}
		if(this.has("Fear") && sealAtk > -6){
			sealAtk = -6;
			skillName = skills[this.weaponIndex].name;
		}
		if(sealAtk < enemy.combatDebuffs.atk){
			enemy.combatDebuffs.atk = sealAtk;
			sealText += this.name + " lowers " + enemy.name + "'s atk by " + (-sealAtk) + " after combat with " + skillName + ".<br>";
		}

		var sealSpd = 0;
		if(this.has("Seal Spd")){
			sealSpd = -this.has("Seal Spd") * 2 - 1;
			skillName = skills[this.bIndex].name;
		}
		if(this.has("Slow") && sealSpd > -6){
			sealSpd = -6;
			skillName = skills[this.weaponIndex].name;
		}
		if(sealSpd < enemy.combatDebuffs.spd){
			enemy.combatDebuffs.spd = sealSpd;
			sealText += this.name + " lowers " + enemy.name + "'s spd by " + (-sealSpd) + " after combat with " + skillName + ".<br>";
		}

		var sealDef = 0;
		if(this.has("Seal Def")){
			sealDef = -this.has("Seal Def") * 2 - 1;
			skillName = skills[this.bIndex].name;
		}
		//Daggers only take effect if the unit performed an attack
		if(this.didAttack){
			if((this.hasExactly("Silver Dagger+") || this.hasExactly("Deathly Dagger")) && sealDef > -7){
				sealDef = -7;
				skillName = skills[this.weaponIndex].name;
			}
			else if((this.hasExactly("Silver Dagger") || this.hasExactly("Rogue Dagger+")) && sealDef > -5){
				sealDef = -5;
				skillName = skills[this.weaponIndex].name;
			}
			else if((this.hasExactly("Iron Dagger") || this.hasExactly("Steel Dagger") || this.hasExactly("Rogue Dagger")) && sealDef > -3){
				sealDef = -3;
				skillName = skills[this.weaponIndex].name;
			}
			else if(this.hasExactly("Poison Dagger+") && sealDef > -6 && enemy.moveType == "infantry"){
				sealDef = -6;
				skillName = skills[this.weaponIndex].name;
			}
			else if(this.hasExactly("Poison Dagger") && sealDef > -4 && enemy.moveType == "infantry"){
				sealDef = -4;
				skillName = skills[this.weaponIndex].name;
			}
		}
		if(sealDef < enemy.combatDebuffs.def){
			enemy.combatDebuffs.def = sealDef;
			sealText += this.name + " lowers " + enemy.name + "'s def by " + (-sealDef) + " after combat with " + skillName + ".<br>";
		}

		var sealRes = 0;
		if(this.has("Seal Res")){
			sealRes = -this.has("Seal Res") * 2 - 1;
			skillName = skills[this.bIndex].name;
		}
		//Daggers only take effect if the unit performed an attack
		if(this.didAttack){
			if((this.hasExactly("Silver Dagger+") || this.hasExactly("Deathly Dagger")) && sealRes > -7){
				sealRes = -7;
				skillName = skills[this.weaponIndex].name;
			}
			else if((this.hasExactly("Silver Dagger") || this.hasExactly("Rogue Dagger+")) && sealRes > -5){
				sealRes = -5;
				skillName = skills[this.weaponIndex].name;
			}
			else if((this.hasExactly("Iron Dagger") || this.hasExactly("Steel Dagger") || this.hasExactly("Rogue Dagger")) && sealRes > -3){
				sealRes = -3;
				skillName = skills[this.weaponIndex].name;
			}
			else if(this.hasExactly("Poison Dagger+") && sealRes > -6 && enemy.moveType == "infantry"){
				sealRes = -6;
				skillName = skills[this.weaponIndex].name;
			}
			else if(this.hasExactly("Poison Dagger") && sealRes > -4 && enemy.moveType == "infantry"){
				sealRes = -4;
				skillName = skills[this.weaponIndex].name;
			}
		}
		if(sealRes < enemy.combatDebuffs.res){
			enemy.combatDebuffs.res = sealRes;
			sealText += this.name + " lowers " + enemy.name + "'s res by " + (-sealRes) + " after combat with " + skillName + ".<br>";
		}

		return sealText;
	}

	this.postCombatBuff = function(){
		var postCombatBuffText = "";

		//Daggers only take effect if the unit performed an attack
		if(this.didAttack){
			var skillName = "";

			//Will need to split these up if there comes another thing which boosts def or res after combat
			var buffDef = 0;
			var buffRes = 0;
			if(this.hasExactly("Rogue Dagger+")){
				buffDef = 5;
				buffRes = 5;
				skillName = skills[this.weaponIndex].name;
			}
			else if(this.hasExactly("Rogue Dagger")){
				buffDef = 3;
				buffRes = 3;
				skillName = skills[this.weaponIndex].name;
			}

			if(buffDef > this.combatBuffs.def){
				this.combatBuffs.def = buffDef;
				postCombatBuffText += this.name + " gains " + buffDef + " def after combat from " + skillName + ".<br>";
			}
			if(buffRes > this.combatBuffs.res){
				this.combatBuffs.res = buffRes;
				postCombatBuffText += this.name + " gains " + buffRes + " res after combat from " + skillName + ".<br>";
			}
		}

		return postCombatBuffText;
	}

	this.postCombatHeal = function(){
		var postCombatHealText = "";

		if(this.initiator){
			var skillname = "";
			
			if(this.has("Blue Egg") || this.has("Green Egg") || this.has("Carrot Axe") || this.has("Carrot Lance")){
				skillName = skills[this.weaponIndex].name;
				var healAmount = 4;
				if(this.maxHp - this.hp < healAmount){
					healAmount = this.maxHp - this.hp;
				}
				if(healAmount > 0){
					this.hp += healAmount;
					postCombatHealText += this.name + " heals " + healAmount + " hp with " + skillName + ".<br>";
				}
			}
		}

		return postCombatHealText;
	}

	//represents one attack of combat
	this.doDamage = function(enemy,brave,AOE){
		//unitAttacked variable for checking daggers and pain
		this.didAttack = true;

		var enemyDefModifier = 0;
		var effectiveBonus = 1.0;
		var dmgMultiplier = 1.0;
		var dmgBoost = 0;
		var absorbPct = 0;

		var damageText = "";

		var effAtk = this.atk + Math.max(this.buffs.atk,this.combatBuffs.atk) + Math.min(this.debuffs.atk,this.combatDebuffs.atk) + this.spur.atk + this.combatSpur.atk;
		var effDef = this.def + Math.max(this.buffs.def,this.combatBuffs.def) + Math.min(this.debuffs.def,this.combatDebuffs.def) + this.spur.def + this.combatSpur.def;
		var effRes = this.res + Math.max(this.buffs.res,this.combatBuffs.res) + Math.min(this.debuffs.res,this.combatDebuffs.res) + this.spur.res + this.combatSpur.res;
		var enemyEffDef = enemy.def + Math.max(enemy.buffs.def,enemy.combatBuffs.def) + Math.min(enemy.debuffs.def,enemy.combatDebuffs.def) + enemy.spur.def + enemy.combatSpur.def;
		var enemyEffRes = enemy.res + Math.max(enemy.buffs.res,enemy.combatBuffs.res) + Math.min(enemy.debuffs.res,enemy.combatDebuffs.res) + enemy.spur.res + enemy.combatSpur.res;

		if(this.panicked){
			effAtk = this.atk - Math.max(this.buffs.atk,this.combatBuffs.atk) - Math.min(this.debuffs.atk,this.combatDebuffs.atk) + this.spur.atk + this.combatSpur.atk;
			effDef = this.def - Math.max(this.buffs.def,this.combatBuffs.def) - Math.min(this.debuffs.def,this.combatDebuffs.def) + this.spur.def + this.combatSpur.def;
			effRes = this.res - Math.max(this.buffs.res,this.combatBuffs.res) - Math.min(this.debuffs.res,this.combatDebuffs.res) + this.spur.res + this.combatSpur.res;
		}

		if(enemy.panicked){
			enemyEffDef = enemy.def - Math.max(enemy.buffs.def,enemy.combatBuffs.def) - Math.min(enemy.debuffs.def,enemy.combatDebuffs.def) + enemy.spur.def + enemy.combatSpur.def;
			enemyEffRes = enemy.res - Math.max(enemy.buffs.res,enemy.combatBuffs.res) - Math.min(enemy.debuffs.res,enemy.combatDebuffs.res) + enemy.spur.res + enemy.combatSpur.res;
		}

		var relevantDef = enemyEffDef;
		if(this.attackType=="magical"){
			relevantDef = enemyEffRes;
		}

		var offensiveSpecialActivated = false;

		if(this.specialIndex!=-1&&skills[this.specialIndex].charge<=this.charge){

			//Do AOE specials
			if(AOE){
				var AOEActivated = false;
				var AOEDamage = 0;
				//AOE specials don't take spur into effect
				var AOEeffAtk = effAtk - this.spur.atk - this.combatSpur.atk;

				if(this.has("Rising Thunder") || this.has("Rising Wind") || this.has("Rising Light") || this.has("Rising Flame") || this.has("Growing Thunder") || this.has("Growing Wind") || this.has("Growing Light") || this.has("Growing Flame")){
					AOEDamage = AOEeffAtk - relevantDef;
				}
				else if(this.has("Blazing Thunder") || this.has("Blazing Wind") || this.has("Blazing Light") || this.has("Blazing Flame")){
					AOEDamage = Math.floor(1.5*(AOEeffAtk - relevantDef));
				}

				if(AOEDamage > 0){
					AOEActivated = true;
					if(enemy.hp - AOEDamage < 1){
						AOEDamage = enemy.hp - 1;
					}
					this.resetCharge();
					enemy.hp -= AOEDamage;
					damageText += "Before combat, " + this.name + " hits with " + skills[this.specialIndex].name + " for " + AOEDamage + ".<br>";
				}
			}
			else{

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
					dmgBoost += effAtk * 0.3;
					offensiveSpecialActivated = true;
				}
				else if(this.has("Dragon Fang")){
					dmgBoost += effAtk * 0.5;
					offensiveSpecialActivated = true;
				}
				else if(this.has("Glowing Ember") || this.has("Bonfire")){
					dmgBoost += effDef/2;
					offensiveSpecialActivated = true;
				}
				else if(this.has("Ignis")){
					dmgBoost += effDef * 0.8;
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
					dmgBoost += effRes/2;
					offensiveSpecialActivated = true;
				}
				else if(this.has("Glacies")){
					dmgBoost += effRes*0.8;
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
			}

			if(offensiveSpecialActivated){
				this.resetCharge();
				damageText += this.name + " activates " + skills[this.specialIndex].name + ". ";

				if(this.has("Wo Dao")){
					dmgBoost += 10;
					damageText += this.name + " gains 10 damage from Wo Dao. ";
					//Does damage boost on AOE skills take effect on attack or AOE?
				}
			}
		}

		//Don't do anything else if it's just an AOE attack
		if(!AOE){
		
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

			//Extra weapon advantage is apparently limited to 0.2 more (doesn't stack)
			var extraWeaponAdvantage = 0;
			if(weaponAdvantage != 0){
				if(this.has("Ruby Sword") || this.has("Sapphire Lance") || this.has("Emerald Axe") || enemy.has("Ruby Sword") || enemy.has("Sapphire Lance") || enemy.has("Emerald Axe")){
					extraWeaponAdvantage = 0.2;
				}
				else{
					if(this.has("Triangle Adept")){
						extraWeaponAdvantage = 0.05 + 0.05 * this.has("Triangle Adept");
					}
					if(enemy.has("Triangle Adept")){
						extraWeaponAdvantage = Math.max(extraWeaponAdvantage,0.05 + 0.05 * enemy.has("Triangle Adept"));
					}
				}	
			}

			var weaponAdvantageBonus = (0.2 + extraWeaponAdvantage) * weaponAdvantage;
			
			if(weaponAdvantage != 0){
				damageText += this.name + "'s attack is multiplied by " + Math.round((1+weaponAdvantageBonus)*10)/10 + " because of weapon advantage. ";
			}

			//Check weapon effective against
			var effectiveBonus = 1;
			if(!(enemy.has("Svalinn Shield") || enemy.has("Iote's Shield"))){
				if(enemy.moveType == "armored" && (this.has("Hammer") || this.has("Armorslayer") || this.has("Heavy Spear"))){
					effectiveBonus = 1.5;
				}
				else if(enemy.moveType == "flying" && (this.has("Excalibur") || this.weaponType=="bow")){
					effectiveBonus = 1.5;
				}
				else if(enemy.moveType == "infantry" && (this.has("Poison Dagger"))){
					effectiveBonus = 1.5;
				}
				else if(enemy.moveType == "cavalry" && (this.has("Raudrwolf") || this.has("Blarwolf") || this.has("Gronnwolf"))){
					effectiveBonus = 1.5;
				}
				else if(enemy.weaponType == "dragon" && (this.has("Falchion") || this.has("Naga"))){
					effectiveBonus = 1.5;
				}

				if(effectiveBonus > 1 ){
					damageText += this.name + "'s attack is multiplied by " + effectiveBonus + " from weapon effectiveness. ";
				}
			}

			//blade tomes
			if(this.has("Raudrblade") || this.has("Blarblade") || this.has("Gronnblade")){
				var bladeDmg = Math.max(this.buffs.atk,this.combatBuffs.atk) + Math.max(this.buffs.spd,this.combatBuffs.spd) + Math.max(this.buffs.def,this.combatBuffs.def) + Math.max(this.buffs.res,this.combatBuffs.res);
				if(bladeDmg > 0){
					damageText += this.name + " gets " + bladeDmg + " extra attack from a blade tome. ";
					effAtk += bladeDmg;
				}
			}

			//Check damage reducing specials
			var defensiveSpecialActivated = false;
			var dmgReduction = 1.0;
			var miracle = false;
			if(enemy.specialIndex!=-1&&skills[enemy.specialIndex].charge<=enemy.charge){
				//gotta check range
				var anyRangeCounter = false;
				if(this.has("Close Counter") || this.has("Distant Counter") || this.has("Raijinto") || this.has("Lightning Breath")){
					anyRangeCounter = true;
				}

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
					damageText += enemy.name + " multiplies damage by " + dmgReduction + " with " + skills[enemy.specialIndex].name + ". ";
				}
				enemy.resetCharge();
			}

			//Weapon mod for healers
			var weaponModifier = 1;
			if(this.weaponType == "staff"){
				//poor healers
				weaponModifier = 0.5;
			}

			//Damage calculation from http://feheroes.wiki/Damage_Calculation
			//use bitwise or to truncate properly
			//Doing calculation in steps to see the formula more clearly
			//debugger;
			var rawDmg = (effAtk*effectiveBonus | 0) + ((effAtk*effectiveBonus | 0)*weaponAdvantageBonus | 0) + (dmgBoost | 0);
			var reduceDmg = relevantDef + (relevantDef*enemyDefModifier | 0);
			var dmg = (rawDmg - reduceDmg)*weaponModifier | 0;
			dmg = (dmg*dmgMultiplier | 0) - (dmg*(1-dmgReduction) | 0);
			dmg = Math.max(dmg,0);
			enemy.hp -= Math.min(dmg,enemy.hp );
			damageText += this.name + " attacks " + enemy.name + " for <span class=\"bold\">" + dmg + "</span> damage.<br>";

			if(enemy.hp <= 0 && miracle){
				enemy.hp = 1;
				defensiveSpecialActivated = true;
				enemy.resetCharge();
				damageText += enemy.name + " survives with 1HP with Miracle.<br>";
			}

			//add absorbed hp
			var absorbHp = dmg*absorbPct | 0;
			if(this.hp + absorbHp > this.maxHp){
				absorbHp = this.maxHp - this.hp;
			}
			this.hp += absorbHp;
			if(absorbHp > 0){
				damageText += this.name + " absorbs " + absorbHp + ".<br>";
			}

			//Special charge does not increase if special was used on this attack
			if(!offensiveSpecialActivated){
				this.charge++;
			}

			if(!defensiveSpecialActivated){
				enemy.charge++;
			}

			//show hp
			//Make sure challenger is first and in blue
			if(this.challenger){
				damageText += this.name + " <span class=\"blue\">" + this.hp + "</span> : " + enemy.name + " <span class=\"red\">" + enemy.hp + "</span><br>";
			}
			else{
				damageText += enemy.name + " <span class=\"blue\">" + enemy.hp + "</span> : " + this.name + " <span class=\"red\">" + this.hp + "</span><br>";
			}
		

			//do damage again if brave weapon
			if(brave && enemy.hp > 0){
				damageText += this.name + " attacks again with a brave weapon.<br>";
				damageText += this.doDamage(enemy);
			}
		}

		return damageText;
	}

	//represents a full round of combat
	this.attack = function(enemy,turn,galeforce){

		var roundText = "";//Common theme: text is returned by helper functions, so the functions are called by adding them to roundText
		var firstTurn = (turn - startTurn == 0);
		this.initiator = true;
		enemy.initiator = false;
		enemy.didAttack = false;

		//Get relevant defense for simplified text output
		var relevantDefType = "def";
		if(enemy.attackType=="magical"){
			relevantDefType = "res";
		}

		//Remove certain buffs
		this.combatBuffs = {"atk":0,"spd":0,"def":0,"res":0};

		//Don't do any buff crap if it's the second move of a turn (galeforce)
		if(!galeforce){
			//Check self buffs (defiant skills)
			roundText += this.defiant();

			//check turn for renewal
			//Does renewal happen before defiant?
			roundText += this.renew(turn);
			roundText += enemy.renew(turn);

			//Check threaten if not first turn (unless startThreatened is on)
			if((threatenRule=="Both"||threatenRule=="Attacker") && firstTurn){
				roundText += enemy.threaten(this);
			}
			if((threatenRule=="Both"||threatenRule=="Defender") || !firstTurn){
				roundText += this.threaten(enemy);
			}
		}

		//Check combat effects
		this.combatSpur = {"atk":0,"spd":0,"def":0,"res":0};
		enemy.combatSpur = {"atk":0,"spd":0,"def":0,"res":0};

		//This blows! (initiating boost skills)
		roundText += this.blow();
		//Initiatee defensive spurs (Naga, Binding Blade)
		roundText += enemy.defendBuff(relevantDefType);

		//Adjust speeds
		var thisEffSpd = this.spd + Math.max(this.buffs.spd,this.combatBuffs.spd) + Math.min(this.debuffs.spd,this.combatDebuffs.spd) + this.spur.spd + this.combatSpur.spd;
		var enemyEffSpd = enemy.spd + Math.max(enemy.buffs.spd,enemy.combatBuffs.spd) + Math.min(enemy.debuffs.spd,enemy.combatDebuffs.spd) + enemy.spur.spd + enemy.combatSpur.spd;

		if(this.panicked){
			thisEffSpd = this.spd - Math.max(this.buffs.spd,this.combatBuffs.spd) - Math.min(this.debuffs.spd,this.combatDebuffs.spd) + this.spur.spd + this.combatSpur.spd;
		}
		if(enemy.panicked){
			enemyEffSpd = enemy.spd - Math.max(enemy.buffs.spd,enemy.combatBuffs.spd) - Math.min(enemy.debuffs.spd,enemy.combatDebuffs.spd) + enemy.spur.spd + enemy.combatSpur.spd;
		}

		//check for any-distance counterattack
		var anyRangeCounter = false;
		if(enemy.has("Close Counter") || enemy.has("Distant Counter") || enemy.has("Raijinto") || enemy.has("Lightning Breath")){
			anyRangeCounter = true;
		}

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
		var brave = false;
		if(this.has("Brave Sword") || this.has("Brave Lance") || this.has("Brave Axe") || this.has("Brave Bow") || this.has("Dire Thunder")){
			brave = true;
		}

		//check for breaker skills
		//Need to rdo this code to avoid repeating twice...
		var thisBroken = false;
		var thisBreakLevel = 2; // hp threshold
		if(this.weaponType=="sword" && enemy.has("Swordbreaker")){
			thisBreakLevel = 1.1 - enemy.has("Swordbreaker") * 0.2;
		}
		else if(this.weaponType=="lance" && enemy.has("Lancebreaker")){
			thisBreakLevel = 1.1 - enemy.has("Lancebreaker") * 0.2;
		}
		else if(this.weaponType=="axe" && enemy.has("Axebreaker")){
			thisBreakLevel = 1.1 - enemy.has("Axebreaker") * 0.2;
		}
		else if(this.weaponType=="redtome" && enemy.has("R Tomebreaker")){
			thisBreakLevel = 1.1 - enemy.has("R Tomebreaker") * 0.2;
		}
		else if(this.weaponType=="bluetome" && enemy.has("B Tomebreaker")){
			thisBreakLevel = 1.1 - enemy.has("B Tomebreaker") * 0.2;
		}
		else if(this.weaponType=="greentome" && enemy.has("G Tomebreaker")){
			thisBreakLevel = 1.1 - enemy.has("G Tomebreaker") * 0.2;
		}
		else if(this.weaponType=="bow" && enemy.has("Bowbreaker")){
			thisBreakLevel = 1.1 - enemy.has("Bowbreaker") * 0.2;
		}
		else if(this.weaponType=="dagger" && enemy.has("Daggerbreaker")){
			thisBreakLevel = 1.1 - enemy.has("Daggerbreaker") * 0.2;
		}
		else if(this.weaponType=="dagger" && enemy.has("Assassin's Bow")){
			thisBreakLevel = 0;
		}

		var enemyBroken = false;
		var enemyBreakLevel = 2; // hp threshold
		if(enemy.weaponType=="sword" && this.has("Swordbreaker")){
			enemyBreakLevel = 1.1 - this.has("Swordbreaker") * 0.2;
		}
		else if(enemy.weaponType=="lance" && this.has("Lancebreaker")){
			enemyBreakLevel = 1.1 - this.has("Lancebreaker") * 0.2;
		}
		else if(enemy.weaponType=="axe" && this.has("Axebreaker")){
			enemyBreakLevel = 1.1 - this.has("Axebreaker") * 0.2;
		}
		else if(enemy.weaponType=="redtome" && this.has("R Tomebreaker")){
			enemyBreakLevel = 1.1 - this.has("R Tomebreaker") * 0.2;
		}
		else if(enemy.weaponType=="bluetome" && this.has("B Tomebreaker")){
			enemyBreakLevel = 1.1 - this.has("B Tomebreaker") * 0.2;
		}
		else if(enemy.weaponType=="greentome" && this.has("G Tomebreaker")){
			enemyBreakLevel = 1.1 - this.has("G Tomebreaker") * 0.2;
		}
		else if(enemy.weaponType=="bow" && this.has("Bowbreaker")){
			enemyBreakLevel = 1.1 - this.has("Bowbreaker") * 0.2;
		}
		else if(enemy.weaponType=="dagger" && this.has("Daggerbreaker")){
			enemyBreakLevel = 1.1 - this.has("Daggerbreaker") * 0.2;
		}
		else if(enemy.weaponType=="dagger" && this.has("Assassin's Bow")){
			enemyBreakLevel = 0;
		}

		if(enemy.hp / this.maxHp >= thisBreakLevel){
			thisBroken = true;
		}
		if(this.hp / this.maxHp >= enemyBreakLevel){
			enemyBroken = true;
		}

		if(thisBroken && enemyBroken){
			roundText += "Both units have breaker skills, so they cancel out.";
			thisBroken = false;
			enemyBroken = false;
		}
		else if(thisBroken){
			roundText += this.name + " is prevented from making a follow-up attack with " + enemy.name + "'s breaker skill.<br>";
		}
		else if(enemyBroken){
			roundText += enemy.name + " is prevented from making a follow-up attack with " + this.name + "'s breaker skill.<br>";
		}

		//Check for firesweep
		var firesweep = false;
		if(this.has("Firesweep Bow")){
			firesweep = true;
		}
		if(enemy.has("Firesweep Bow")){
			firesweep = true;
		}

		//check for windsweep
		//This skill is a fucking mess
		var windsweep = 0;
		if(this.has("Windsweep")){
			windsweep = this.has("Windsweep")*-2 + 7;
		}

		//Do AOE damage
		roundText += this.doDamage(enemy,false,true);

		var thisFollowUp = false;
		var enemyCanCounter = false;
		var enemyFollowUp = false;

		//I split up the follow-up rules to be less confusing, so there are extra computations
		if(thisEffSpd-enemyEffSpd >= 5){
			thisFollowUp = true;
		}
		if(thisEffSpd-enemyEffSpd <= -5){
			enemyFollowUp = true;
		}

		if(waryFighter){
			thisFollowUp = false;
			enemyFollowUp = false;
		}
		if(thisBroken){
			thisFollowUp = false;
			if(!waryFighter || thisEffSpd-enemyEffSpd <= -5){
				enemyFollowUp = true;
			}
		}
		if(enemyBroken){
			if(!waryFighter || thisEffSpd-enemyEffSpd >= 5){
				thisFollowUp = true;
			}
			enemyFollowUp = false;
		}
		if(brashAssault){
			if(!waryFighter || thisEffSpd-enemyEffSpd >= 5){
				thisFollowUp = true;
			}
		}
		if(quickRiposte){
			if(!waryFighter || thisEffSpd-enemyEffSpd <= -5){
				enemyFollowUp = true;
			}
		}
		//A unit with Wary Fighter can never double, even in a situation where the opponent can
		if(thisWaryFighter){	
			thisFollowUp = false;
		}
		if(enemyWaryFighter){
			enemyFollowUp = false;
		}
		if(windsweep){
			thisFollowUp = false;
		}

		if(!firesweep && !(windsweep && physicalWeapons.indexOf(enemy.weaponType) != -1 && thisEffSpd-enemyEffSpd >= windsweep)){
			if(this.range==enemy.range || anyRangeCounter){
				enemyCanCounter = true;
			}
		}

		//Do vantage damage
		//Enemy attacks
		if(vantage && enemyCanCounter){
			roundText += enemy.name + " counterattacks first with vantage.<br>";
			roundText += enemy.doDamage(this);
		}

		//This attacks
		if(this.hp>0){
			roundText += this.doDamage(enemy,brave);
		}

		//Do desperation
		//This attacks
		if(this.hp > 0 && enemy.hp > 0 && desperation && thisFollowUp){
			roundText += this.name + " attacks again immediately with desperation.<br>";
			roundText += this.doDamage(enemy,brave);
		}

		//Enemy attacks, either vantage follow-up or first attack
		if(enemy.hp > 0 && this.hp > 0 && (!vantage || (vantage && enemyFollowUp && enemyCanCounter))){
			if(enemyCanCounter){
				roundText += enemy.doDamage(this);
			}
		}

		//Don't do this attack if already did desperation
		//or if broken
		//This attacks again
		if(this.hp>0 && enemy.hp > 0 && !desperation && thisFollowUp){
			roundText += this.doDamage(enemy,brave);
		}

		//Enemy attacks, non-vantage follow-up
		if(this.hp>0 && enemy.hp > 0 && !vantage && enemyCanCounter && enemyFollowUp){
			roundText += enemy.doDamage(this);
		}

		//Do post-combat damage to enemy if enemy isn't dead	
		if(enemy.hp>0){
			roundText += this.poisonEnemy(enemy);
			roundText += this.painEnemy(enemy);
			roundText += enemy.fury();
		}

		//Do post-combat damage to this if this isn't dead
		//No poison because this initiated
		if(this.hp>0){
			roundText += enemy.painEnemy(this);
			roundText += this.fury();
		}

		//Remove debuffs - if action done
		if(enemy.didAttack){
			enemy.combatDebuffs = {"atk":0,"spd":0,"def":0,"res":0};
			enemy.panicked = false;
		}
		if(this.didAttack){
			this.combatDebuffs = {"atk":0,"spd":0,"def":0,"res":0};
			this.panicked = false;
		}

		//Do stuff if both aren't dead
		if(this.hp > 0 && enemy.hp > 0){
			//Apply post-combat debuffs (seal)
			roundText += this.seal(enemy);
			roundText += enemy.seal(this);

			//post-combat buffs
			//Rogue dagger works on enemy turn, but buffs are reset at beginning of player turn, so it only matters if a rogue gets attacked twice in one turn, which is possible with Galeforce
			roundText += this.postCombatBuff();
			roundText += enemy.postCombatBuff();
			roundText += this.postCombatHeal();

			//panic
			if(this.has("Panic")){
				enemy.panicked = true;
				roundText += this.name + " panics " + enemy.name + ".<br>";
			}
			if(enemy.has("Panic")){
				this.panicked = true;
				roundText += enemy.name + " panics " + this.name + ".<br>";
			}

			//Finally, Galeforce!
			if(this.has("Galeforce") && skills[this.specialIndex].charge<=this.charge && useGaleforce){
				roundText += this.name + " initiates again with Galeforce!<br>";
				this.resetCharge();
				roundText += this.attack(enemy,turn,true);
			}
		}

		return roundText;
	}
}