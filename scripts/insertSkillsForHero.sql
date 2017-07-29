insert into fireemblemheroes.hero_skill (hero_id, skill_id, rarity)
select hero_id, skill_id, 5
from (
	(
		select skill_id
    from skill
    where slot != 's'
    and (
			skill.name = 'Thunder'
			or skill.name = 'Elthunder'
			or skill.name = 'Sealife Tome'
			or skill.name = 'Sealife Tome+'
			or skill.name = 'Dragon Gaze'
      or skill.name = 'Dragon Fang'
      or skill.name = 'Darting BLow 1'
      or skill.name = 'Swift Strike 1'
      or skill.name = 'Swift Strike 2'
      or skill.name = 'Fortify Res 1'
      or skill.name = 'Fortify Res 2'
      or skill.name = 'Fortify Fliers'
		)
	) skills join
  (
		select hero_id
    from heroes
    where heroes.name = 'Summer Corrin'
	) hero
)
