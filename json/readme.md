# JSON Data

If using SQL export to JSON, use 'find all and replace' and replace number Strings to Int: 

	Expression: "(\-{0,1}[0-9]+(\.[0-9]+){0,1})"
	
	Replace: \1

## HEROES TABLE - hero.json

Bases stats are for 5* rarity

Max stats can be calculated from base stats and growth values

minrarity not used for anything at the moment (2017-07-23)

## HERO SKILLS TABLE - hero_skill.json

Joins many-to-many relationship between heroes and their natural skills

Rarity for many is guessed

Make sure to include all skills and prerequisites for each hero

I (Andy) had created a database updating tool for my own personal use that took care of this (examples in old_resoure folder)

## SKILLS TABLE - skill.json

Inheritrule can be multiple traits separated by commas

ex: melee,physical (for Galeforce)

affectsduel determines whether a skill is shown if "show only skills that affect duel" is selected

## SKILL PREREQS TABLE - skill_prereq.json

Joins many-to-many relationship between skills and prerequisites

Good luck manually updating this shit (I (Jason) might kill this table and combine it into skills table...)

I (Andy) had created a database updater for my own personal use to handle this (examples in old_resoure folder)

## WEAPON REFINES TABLE - weapon_refine.json

Seperates weapon refinements into categories that separates different descriptions.

Holds individual prereq information for each refinement.

Remember to create a set of new entries for refinements that has unique descriptions.

## CUSTOM LISTS TABLE - custom_lists.json

Contain keys to public Google Sheet feeds.

Allows modifiers to specify range being read.

The Google Sheet MUST be public and shared on the web.

The KEY is aquired from the URL of the Google Sheet. (For example, https://docs.google.com/spreadsheets/d/1vwymjyksChc84apCilDJtU2oit2xh--tcx9neeziF1M/)

If you want to submit a list, add an entry to the JSON and make a new pull request.