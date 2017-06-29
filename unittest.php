<?php

//Get entire database to javascript
$heroScript = getData("hero");
$skillScript = getData("skill");
$prereqScript = getData("skill_prereq");
$heroskillScript = getData("hero_skill");

function getData($table){
	require("dbHeroes.php");
	$stmt = $db->prepare("select * from " . $table);
	$stmt->execute();

	$js = "[";
	while($result = $stmt->fetch()){
		$js .= "{";
		foreach ($result as $var => $value) {
			if(!is_numeric($var)){
				if(!is_numeric($value)){
					$value = str_replace("\"", "\\\"", $value);
					$value = "\"" . $value . "\"";
				}
				$js .= "\"" . $var . "\":" . $value . ",";
			}
		}
		$js = trim($js,",") . "},";
	}
	$js = trim($js,",") . "]";
	return $js;
}
?>

<!doctype html>
<html>

<head>
	<title>MDS Unit Testing</title>

	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
	<!--<script src="https://unpkg.com/react@15/dist/react.js"></script>
	<script src="https://unpkg.com/react-dom@15/dist/react-dom.js"></script>-->

	<script>
		var data = {};
		data.heroes = <?php echo $heroScript;?>;
		data.skills = <?php echo $skillScript;?>;
		data.prereqs = <?php echo $prereqScript;?>;
		data.heroSkills = <?php echo $heroskillScript;?>;
	</script>

	<script type="text/javascript" src="code.js?v=25"></script>

	<style>
		body{
			font-family:"Segoe UI";
			font-size:16px;
		}
		.pass{
			color:#00cc00;
			display:none;
		}
		.fail{
			color:#cc0000;
		}
	</style>

</head>
<body>
	Show: <select id="showtestresults" onchange="switchShown();"><option value="0">Only fail</option><option value="1">All</option></select>
	<div id="results"></div>
	<script>
		var showPass = $("#showtestresults").val();
		var testOn = 0;

		function switchShown(){
			showPass = $("#showtestresults").val();
			if(showPass == 1){
				$(".pass").show();
			}
			else{
				$(".pass").hide();
			}	
		}

		function test(message, func, expectedResult){
			var display = "";
			var text = "<div class=\"fail\">";
			var pass = false;
			var err = "";
			try{
				var result = func();
			}
			catch(e){
				err = " ::: Error: " + e;
			}
			if(result == expectedResult){
				pass = true;
				text = "<div class=\"pass\">";
			}
			text += testOn + " ::: <b>" + message + "</b> ::: expected " + expectedResult + ", got " + result + err + "</div>";
			testOn++;
			$("#results").append(text);
		}

		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//Tests motherfucker
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		(function testEverything(){
			test("Testing that test works",function(){
				return 1;
			}, 1);

			test("getGrowthValue/Returns the correct value for growth level 6 at rarity 5",function(){
				return getGrowthValue(6,5);
			}, 22);
			test("getGrowthValue/Returns 0 for invalid input",function(){
				return getGrowthValue(7,7);
			}, 0);

			test("addStats/Adds atk and spd on two objects",function(){
				var newStats = addStats({atk:4,spd:3,def:6},{atk:3,spd:9,res:1});
				return newStats.atk + "," + newStats.spd;
			}, "7,12");
			test("maxMagStats/Gets highest magnitude between two objects",function(){
				var newStats = maxMagStats({atk:-4,spd:3,def:6},{atk:-3,spd:9,res:1});
				return newStats.atk + "," + newStats.spd;
			}, "-4,9");

			test("Hero/Default/Can create with no input",function(){
				testDumbHero = new Hero();
				return testDumbHero instanceof Hero;
			}, true);

			test("Hero/Indexed/Can create with numeric input",function(){
				testIndexedHero = new Hero(0);
				return testIndexedHero.name;
			}, data.heroes[0].name);
			test("Hero/Indexed/Generates default base atk",function(){
				return testIndexedHero.atk;
			}, 33);

			test("Hero/Custom/Has atk if given atk and not real hero",function(){
				testCustomHero = new Hero({index:-2,merge:2,rarity:4,atk:5});
				return testCustomHero.atk;
			}, 5);

			test("Hero/Custom/Generates correct base spd if real hero",function(){
				testRealHero = new Hero({index:0,merge:0,rarity:5,spd:5});
				return testRealHero.spd;
			}, 32);
			test("Hero/Custom/Updates spd if given speed-boosting skill",function(){
				testRealHero.modify({a:409});//Speed 3
				return testRealHero.spd;
			}, 35);
			test("Hero/Custom/Sets right speed if given merge bonuses and lower rarity",function(){
				testRealHero2 = new Hero({index:0, merge:6, rarity:4, spd:5});
				return testRealHero2.spd;
			}, 33);
			test("Hero/Custom/Sets right speed if given merge bonuses and lower rarity and bane",function(){
				testRealHero3 = new Hero({index:0, merge:6, rarity:4, spd:5, bane: "spd"});
				return testRealHero3.spd;
			}, 29);
			test("Hero/Custom/Sets right base speed if given merge bonuses and lower rarity and bane",function(){
				testRealHero3 = new Hero({index:0, merge:6, rarity:4, spd:5, bane: "spd"});
				return testRealHero3.getBaseStats().spd;
			}, 9);

			test("ActiveHero/Default/Can create without param",function(){
				testDumbActiveHero = new ActiveHero();
				return testDumbActiveHero instanceof ActiveHero;
			}, true);
			test("ActiveHero/Default/Has atk",function(){
				return $.isNumeric(testDumbActiveHero.atk);
			}, true);

			test("ActiveHero/Indexed/Can create with hero index",function(){
				testIndexedActiveHero = new ActiveHero(0);
				return testIndexedActiveHero.name;
			}, data.heroes[0].name);

			test("ActiveHero/Hero/Can create with Hero",function(){
				testActiveHero = new ActiveHero(testRealHero3);
				return testIndexedActiveHero.name;
			}, data.heroes[0].name);

			test("ActiveHero Battle/No damage if no weapon",function(){
				var hero1 = new ActiveHero(new Hero({
					index: -2,
					atk:2
				}));
				var hero2 = new ActiveHero(new Hero({
					index: -2
				}));
				hero1.doDamage(hero2);
				return hero2.hp;
			}, 1);

		})();

		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//End Tests motherfucker
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	</script>
</body>