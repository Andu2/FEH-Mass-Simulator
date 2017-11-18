-- Safe update mode off --
delete from fireemblemheroes.hero_skill
where hero_skill.hero_id in
	(
		select hero_id from fireemblemheroes.heroes where heroes.name = 'Summer Leo'
	)
    and
    hero_skill.skill_id in
    (
		select skill_id from fireemblemheroes.skill where
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
