insert into skill_prereq 
select skillThatNeedsPrereq.skill_id, prereq.skill_id
from skill skillThatNeedsPrereq join skill prereq
where
(skillThatNeedsPrereq.name = 'Spd Res 2' and skillThatNeedsPrereq.slot != 's')
and
(prereq.name = 'Spd Res 1' and prereq.slot != 's');