<?php

mysql_connect('localhost', '', '');
mysql_select_db('');

$id = mysql_real_escape_string($_GET['id']);

if ($id) {
  $result = mysql_query("select data from saves where id='$id'");
  echo mysql_error();
  $datas = mysql_fetch_assoc($result);

  echo str_replace('\"', '"', $datas['data']);
}
else if ($_POST['datas']) {
  $datas = mysql_real_escape_string($_POST['datas']);
  $result = mysql_query("insert into saves (data) values('$datas')");
  echo mysql_insert_id();
}

?>
