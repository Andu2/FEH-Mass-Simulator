<?php
$db = new PDO("mysql:host=localhost;dbname=fireemblemheroes","root");
$db->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
?>