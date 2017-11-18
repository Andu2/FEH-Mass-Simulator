insert into fireemblemheroes.hero_skill (hero_id, skill_id, rarity)
select hero_id, skill_id, 5
from (
	(
		select skill_id
		from skill
		where slot != 's'
		and (
			skill.name = 'Wind'
			or skill.name = 'Elwind'
			or skill.name = 'Hibiscus Tome'
			or skill.name = 'Hibiscus Tome+'
			or skill.name = 'Rally Attack'
			or skill.name = 'Rally Attack Resistance'
			or skill.name = 'Speed 1'
			or skill.name = 'Spd Res 1'
			or skill.name = 'Spd Res 2'
			or skill.name = 'Green Tome Valor 1'
			or skill.name = 'Green Tome Valor 2'
			or skill.name = 'Green Tome Valor 3'
		)
	) skills join
	(
		select hero_id
		from heroes
		where heroes.name = 'Summer Elise'
	) hero
)
