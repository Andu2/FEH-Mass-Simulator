# FEH Mass Duel Simulator

Now hosted on [GitHub Pages](https://andu2.github.io/FEH-Mass-Simulator/) so anyone can do the developing!

## About

The entire code (UI and logic mixed, unfortunately) is in code.js. The JSON data transferred from my personal MySQL database is in db.js.

When this project used PHP and MySQL, I had a database updating tool. Perhaps something similar can be created for the JSON-based data. The tool is found under the "database-add" folder.

This project uses jQuery and [Select2](https://select2.github.io/).

Remember to change the query string parameter "v=#" on the script tags on index.html to break the cache when you push a new update.

Remember to add images for new heroes and skills. Keep bandwidth in mind. I believe GitHub Pages has a 100GB bandwidth per month limit.

## Notes from Andy

Here are some things I wanted to do before I stopped updating. I'm not saying that these have to be developed, because I'm not in charge of the project anymore. They're just fun ideas!

* I wanted to take the calculation functions off the ActiveHero object, because I was concerned that the functions were being created once per ActiveHero, taking up way more space than necessary (not actually sure if this is how JavaScript works)
* Add a Battle object representing a battle (things like round number and result) and a Hero object representing hero settings (not in battle). Some things consistent throughout a battle like weapon advantage can be part of the Battle?
* Add defensive terrain...
* Save hero settings data to local storage automatically, so the calculator is set up the same when a user goes back to it
* Add option to save challenger settings and enemy settings each in save slots
* Add statistics and graphs to results
* Add little pop-up simulation if user clicks a results box that animates the battle and displays the stats and statuses as the battle progresses - would be useful for debugging, too
* Custom stat heroes for both challenger and enemies, for things like generic enemies and buffed story map heroes

Feel free to do some major refactoring. There are a lot of ways that big functions can be broken down. I started doing some refactoring on the "dev" branch, but never got around to completing all the stuff I was adding.