/*
Finish date: 4/7/2023, Friday 9:04 PM
Background: rgb(221, 238, 250)
Classic: rgba(0,176,217,255)
Blitz: rgba(251,209,86,255)
Long: rgb(212, 139, 139)
Name: rgba(119,207,132,255)
*/

// Menu screen: before database import because default screen is classic, don't want that
var game_mode;
setScreen("menu");
onEvent("start_classic", "click", function(){setScreen("purgatory_classic")});
onEvent("start_blitz", "click", function(){setScreen("purgatory_blitz")});
onEvent("start_long", "click", function(){setScreen("purgatory_long")});
onEvent("start_name", "click", function(){setScreen("purgatory_name")});

//Import database
var MASTER_LIST = getColumn("expanded_words", "words"); var NAME_LIST = getColumn("names", "names"); var COMMON_NAME_LIST = getColumn("common_names", "names");
var MASTER_LIST_LENGTH = MASTER_LIST.length; var NAME_LIST_LENGTH = NAME_LIST.length; var COMMON_NAME_LIST_LENGTH = COMMON_NAME_LIST.length;
var PART_LENGTH = 3;

// Search mechanics
function in_database(search_value, isMaster){
  search_value = search_value.toLowerCase();
  var low=0; var mid; var high=[NAME_LIST_LENGTH-1, MASTER_LIST_LENGTH-1][+isMaster];
  var current_group;
  while (low + 1 < high){
    mid = Math.floor((low+high)/2);
    if (isMaster) {current_group = MASTER_LIST[mid].split(";");}
    else {current_group = NAME_LIST[mid].split(";");}
    
    // If less than the first value of the group, then search groups below it
    // If greater than the last value of the group, search groups above it
    // If it is neither, then the word is either in the group or doesn't exist
    if (search_value < current_group[0]) {high = mid;}
    else if (search_value > current_group[current_group.length-1]){low=mid;}
    else {low=mid;break;}
  }
  // Search value is either in this range or not
  var valid_value_range;
  if (isMaster){valid_value_range = MASTER_LIST[low].split(";").concat(MASTER_LIST[high].split(";"));}
  else {valid_value_range = NAME_LIST[low].split(";").concat(NAME_LIST[high].split(";"));}
  
  // Search if the exact value is inside of this range
  for (var i=0; i < valid_value_range.length; i++){
    if (search_value == valid_value_range[i]){return true;}
  }
  return false;
}

function has_vowel(l){
  l = l.toLowerCase();
  var vowels = ['a','e','i','o','u','y'];
  for (var i=0; i < l.length; i++){
    if (vowels.indexOf(l[i]) != -1) {return true}
  }
  return false;
}

function calc_correct_answer(user_input, word_part, impossible_length){
  // desired_length is an optional parameter for long
  
  // Always a lost if shorter than word part or already encountered
  user_input = user_input.toLowerCase();
  if (user_input.length < PART_LENGTH || encountered.indexOf(user_input) != -1){return false;}
  switch (game_mode){
    case "classic":
      // Correct when the part exists, exists in the dictionary
      return has_vowel(user_input) && user_input.indexOf(word_part) != -1 && in_database(user_input, true);
    case "blitz":
      // Correct when part exists, exists in the dictionary
      return has_vowel(user_input) && user_input.indexOf(word_part) != -1 && in_database(user_input, true);
    case "long":
      // Correct when longer than designated length, contains word part, exists in dictionary
      return has_vowel(user_input) && user_input.length > impossible_length && user_input.indexOf(word_part) != -1 && in_database(user_input, true);
    case "name":
      // Correct when contains name part and exists in the name dictionary
      return has_vowel(user_input) && user_input.indexOf(word_part) != -1 && in_database(user_input, false);
  }
}
// Random word part mechanics
function generate_part(){
  // Get random word that isn't in encountered words, select random part 
  // If name game mode, choose the first 3 letters from COMMON NAMES
  var random_group_index; var random_group; var random_word_index; var current_list_length;
  
  if (game_mode != "name"){
    current_list_length = MASTER_LIST_LENGTH;
    random_group_index = randomNumber(0, current_list_length-1);
    random_group = MASTER_LIST[random_group_index].split(";");
    random_word_index = randomNumber(0, random_group.length-1);
  }
  else {
    current_list_length = COMMON_NAME_LIST_LENGTH;
    random_group_index = randomNumber(0, current_list_length-1);
    random_group = COMMON_NAME_LIST[random_group_index].split(";");
    random_word_index = randomNumber(0, random_group.length-1);
  }
  
  // move onto next word if this word is already encountered. Move onto next group if filled up
  while((encountered.indexOf(random_group[random_word_index]) != -1 || !has_vowel(random_group[random_word_index]))&& random_group_index < current_list_length - 1){
    // If on last index of the group, move onto next group and reset random_word_index to 0
    if (random_word_index == random_group.length - 1){
      random_group_index++;
      if (game_mode != "name"){random_group=MASTER_LIST[random_group_index].split(";")}
      else{random_group=COMMON_NAME_LIST[random_group_index].split(";");}
      random_word_index=0;continue; // Don't increment random word_index again
    }
    random_word_index++;
  }
  
  
  // Get random part of the word
  var current_word = random_group[random_word_index];
  
  // If name game mode, return first 3 letters
  if (game_mode=="name"){return current_word.slice(0, 3)}
  
  var start_index = randomNumber(0, current_word.length-3);
  var word_part = current_word.slice(start_index,start_index+3);
  // Return the word part. If it's long game mode also return the impossible length (lowest length bound)
  // Initially impossible length was current_word.length-1 because it guarentees there is 1 word above it. But too it tends to generate really long words, so nerfed with /1.3
  // Floor and /1.8 guarentees that the impossible_length is at least 1 less than current_word.length
  return (game_mode!="long") ? word_part : [word_part, Math.floor(current_word.length/1.8)];
}
// Set up game
var current_part; var impossible_length; var score;var lives;var encountered;
function set_up_game(){
  // Set global variable current_part text box to random word and clear current input_box. Set up new length for long
  switch (game_mode){
    case "classic":
      current_part = generate_part("classic");
      setText("current_part_classic", current_part.toUpperCase());
      setText("user_input_classic", "");
      break;
    case "blitz":
      current_part = generate_part("blitz");
      setText("current_part_blitz", current_part.toUpperCase());
      setText("user_input_blitz", "");
      break;
    case "long":
      var r = generate_part("long");
      current_part = r[0];
      impossible_length = r[1];
      setText("current_part_long", current_part.toUpperCase());
      setText("length_long", "With more letters than: " + impossible_length);
      setText("user_input_long", "");
      break;
    case "name":
      current_part = generate_part("name");
      setText("current_part_name", current_part.toUpperCase());
      setText("user_input_name", "");
      break;
  }
}

// In-game behind the scene mechanics
function set_time_left_label(time_left){setText("time_left_"+game_mode, time_left);}
function hide_health(n){hideElement("health_label_"+game_mode+"_"+n);}
function show_all_health(){
  for (var i=1; i<=3; i++){showElement("health_label_"+game_mode+"_"+i);}
  // Warning for blitz because there is only health 1. But ignore it.
}
function set_up_timer(time_left){
  // Stop the previous timed loops to reset it
  stopTimedLoop();
  var total_time = time_left;
  set_time_left_label(time_left);
  timedLoop(1000, function(){
    time_left--;
    set_time_left_label(time_left);
    // If time runs out, subtract the lives. If lives run out, end the game
    if (time_left==0){
      lives--;
      if (!lives){lose()}
      else{
        // If lives isn't 0, reset the word and call itself to setup timer
        set_up_game(game_mode);
        set_up_timer(total_time);
        hide_health(lives+1);
      }
    }
    
  });
}
function set_score_label_game(n){setText("score_label_"+game_mode, n)}
function game_interaction(){
  // Get the user input, check if the user input is a win condition. If so, give points, clear text box, move onto next word, reset timer. If not, subtract point, clear text box, move onto next word, reset timer.
  var user_input = getText("user_input_"+game_mode);
  if (calc_correct_answer(user_input, current_part, impossible_length)){
    set_up_game(game_mode);
    score++;
    set_score_label_game(score);
    set_up_timer((game_mode!="blitz")?10:5, game_mode);
  }
  else{setText("user_input_"+game_mode, "")}
}
function write_score(){setText("score_label_leaderboard", "Score: " + score);}
function lose(){
  // Leaderboard screen, parameter should be the game mode you were playing
  // Write only top three scores (if not logged in) so it doesn't mix with the text
  setScreen("leaderboard");
  stopSound();
  stopTimedLoop();
  write_score(0);
  set_score_label_game(10);
  if (!username){
    login_set(true);
    write_leaderboard(false);
  }
  else {
    login_set(false);
    update_score_and_write_leaderboard(score, get_date()); // write leaderboard is in update_score because of the callback
  }
}
function login_set(on){
  // Login UI setup or unsetup
  if(on){login_is_hidden=false;showElement("login_label");showElement("login_instructions");showElement("username_input");showElement("password_input");showElement("enter_button_leaderboard");}
  else {login_is_hidden=true;hideElement("login_label");hideElement("login_instructions");hideElement("username_input");hideElement("password_input");hideElement("enter_button_leaderboard");}
}
function login_notif(type){
  switch (type){
    case "bad_login_notification":
      showElement("bad_login_notification");
      setTimeout(function(){hideElement("bad_login_notification")}, 1500);
      break;
    case "new_account_notification":
      showElement("new_account_notification");
      setTimeout(function(){hideElement("new_account_notification")}, 1500);
      break;
  }
}
function login(){
  // Logs user in or signs user up
  /*
  Gets user input
  Checks if username exists. If so, get the database password associated with it.
  If the entered password matches the database password, remove login UI and update leaderboard. (username now has a value so login() doesn't have to be called later)
  If the password doesn't match, but the username exists, then the account exists but password isn't right. Notify the user.
  Otherwise, it is a new account. Set up the user object and create it. Write leaderboard in callback to happen after it.
  Clear the inputs in all cases.
  */
  var username_input=getText("username_input");
  var password_input=getText("password_input");
  var correct_password; var username_exists=false;
  
  var all_usernames=getColumn("user_data", "username");
  var all_passwords=getColumn("user_data", "password");
  for (var i=0; i<all_usernames.length;i++){
    if (all_usernames[i].toLowerCase()==username_input.toLowerCase()){
      username_exists=true;
      correct_password=all_passwords[i];
      break;
    }
  }
  
  if (password_input==correct_password){
    username = username_input;
    update_score_and_write_leaderboard(score, get_date());
    login_set(false);
  }
  else if(username_exists){
    login_notif("bad_login_notification");
  }
  else{
    switch (game_mode){
      case "classic":
        createRecord("user_data", {username:username_input, password:password_input, score_classic:score, score_blitz:null,score_long:null,score_name:null,date_classic:get_date(),date_blitz:null,date_long:null,date_name:null}, function(){write_leaderboard(true)});
        break;
      case "blitz":
        createRecord("user_data", {username:username_input, password:password_input, score_classic:null, score_blitz:score,score_long:null,score_name:null,date_classic:null,date_blitz:get_date(),date_long:null,date_name:null}, function(){write_leaderboard(true)});
        break;
      case "long":
        createRecord("user_data", {username:username_input, password:password_input, score_classic:null, score_blitz:null,score_long:score,score_name:null,date_classic:null,date_blitz:null,date_long:get_date(),date_name:null}, function(){write_leaderboard(true)});
        break;
      case "name":
        createRecord("user_data", {username:username_input, password:password_input, score_classic:null, score_blitz:null,score_long:null,score_name:score,date_classic:null,date_blitz:null,date_long:null,date_name:get_date()}, function(){write_leaderboard(true)});
        break;
    }
    username=username_input;
    login_notif("new_account_notification");
    login_set(false);
  }
  
  setText("username_input", "");setText("password_input", "");
}
function score_compare(a,b){
  // Sort weighing for the scores of different game modes
  if (a==undefined){return -1}
  else if(b==undefined){return 1}
  switch (game_mode){
    case "classic":
      return b.score_classic-a.score_classic;
    case "blitz":
      return b.score_blitz-a.score_blitz;
    case "long":
      return b.score_long-a.score_long;
    case "name":
      return b.score_name-a.score_name;
  }
  
}
function get_date(){
  // Returns current date in proper format (getMonth returns 0-11, not 1-12)
  var current_date = new Date();
  return (current_date.getMonth() + 1) + "/" + current_date.getDate() + "/" + current_date.getFullYear();
}
function write_leaderboard(has_logged_in){
  // Write the text portion of the leaderboard.
  /*Sorts user_data in descending order of scores, depending on game mode
  Adds each line of the user data  in proper format (8 spaces before score and 2 spaces between score and date)
  Adds only the top 3 if the user hasn't logged in (so it doesn't overlap with login UI)
  */
  readRecords("user_data", {}, function(records){
    records = records.sort(score_compare);
    var leaderboard_text = game_mode[0].toUpperCase()+game_mode.slice(1).toLowerCase() + "\n\n";
    var place=1; var current_record; var current_username; var current_game_mode_score; var current_game_mode_date;
    for (var i=0; i<records.length;i++){
      if (!has_logged_in && place>3){break}
      current_record=records[i];
      current_username=current_record.username;
      current_game_mode_score=(game_mode=="classic")?current_record.score_classic:
        (game_mode=="blitz")?current_record.score_blitz:
        (game_mode=="long")?current_record.score_long:
        (game_mode=="name")?current_record.score_name:null;
      current_game_mode_date=(game_mode=="classic")?current_record.date_classic:
        (game_mode=="blitz")?current_record.date_blitz:
        (game_mode=="long")?current_record.date_long:
        (game_mode=="name")?current_record.date_name:null;
      if (current_game_mode_score==null && current_game_mode_score==undefined){continue}
      leaderboard_text += place + ".  " + current_username + "\n        " + current_game_mode_score + "  "+ current_game_mode_date+"\n";
      place++;
    }
    setText("leaderboard_text", leaderboard_text);
  });
}
function update_score_and_write_leaderboard(current_score, current_date){
  // Updates user record to have the maximum score and date associated with the maximum score
  /*Get all all data associated with the current user
  Updates score and date if the newly earned score is the maximum
  Creates new object that includes all data of the user
  Updates score and date of the new object
  Updates the record with the object
  Writes leaderboard because it needs to happen in the callback (otherwise writes leaderboard before record updates)
  */

  var user_id; var password; var previous_score; var previous_date;
  var all_ids=getColumn("user_data", "id");
  var all_users=getColumn("user_data", "username");
  var all_passwords=getColumn("user_data", "password");
  var all_scores=getColumn("user_data", "score_"+game_mode);
  var all_dates=getColumn("user_data", "date_"+game_mode);
  for (var i=0;i<all_users.length;i++){
    if (username.toLowerCase()==all_users[i].toLowerCase()){
      user_id=+all_ids[i];
      password=all_passwords[i];
      previous_score=all_scores[i];
      previous_date=all_dates[i];
      break;
    }
  }
  var new_score=previous_score; var new_date=previous_date;
  if (current_score > previous_score || previous_score==null){new_score=current_score;new_date=current_date;}
  
  readRecords("user_data", {id:user_id}, function(r){
    var new_data=r[0];
    new_data.id=user_id;
    switch (game_mode){
      case "classic":
        new_data.score_classic=new_score;
        new_data.date_classic=new_date;
        break;
      case "blitz":
        new_data.score_blitz=new_score;
        new_data.date_blitz=new_date;
        break;
      case "long":
        new_data.score_long=new_score;
        new_data.date_long=new_date;
        break;
      case "name":
        new_data.score_name=new_score;
        new_data.date_name=new_date;
        break;
    }
    updateRecord("user_data", new_data, function(){write_leaderboard(true);});
  });
  
}

function start_game(){
  switch (game_mode){
    case "classic":
      setScreen("classic");show_all_health();score=0;lives=3;encountered=[];set_up_game("classic");set_up_timer(10);playSound("ost2.mp3",true);
      break;
    case "blitz":
      setScreen("blitz");show_all_health();score=0;lives=1;encountered=[];set_up_game("blitz");set_up_timer(5);playSound("ost1.mp3",true);
      break;
    case "long":
      setScreen("long");show_all_health();score=0;lives=3;encountered=[];set_up_game("long");set_up_timer(10);playSound("ost4.mp3",true);
      break;
    case "name":
      setScreen("name");show_all_health();score=0;lives=3;encountered=[];set_up_game("name");set_up_timer(10);playSound("ost3.mp3",true);
      break;
  }
}


// Purgatory button setup
onEvent("enter_purgatory_classic", "click", function(){game_mode="classic";start_game()});
onEvent("enter_purgatory_blitz", "click", function(){game_mode="blitz";start_game()});
onEvent("enter_purgatory_long", "click", function(){game_mode="long";start_game()});
onEvent("enter_purgatory_name", "click", function(){game_mode="name";start_game()});

onEvent("leaderboard_purgatory_classic", "click", function(){setScreen("leaderboard"); game_mode="classic";write_leaderboard(username!="");});
onEvent("leaderboard_purgatory_blitz", "click", function(){setScreen("leaderboard"); game_mode="blitz";write_leaderboard(username!="")});
onEvent("leaderboard_purgatory_long", "click", function(){setScreen("leaderboard"); game_mode="long";write_leaderboard(username!="")});
onEvent("leaderboard_purgatory_name", "click", function(){setScreen("leaderboard"); game_mode="name";write_leaderboard(username!="")});

onEvent("back_purgatory_classic", "click", function(){setScreen("menu")});
onEvent("back_purgatory_blitz", "click", function(){setScreen("menu")});
onEvent("back_purgatory_long", "click", function(){setScreen("menu")});
onEvent("back_purgatory_name", "click", function(){setScreen("menu")});

// If enter key is pressed down, add point if correct.
onEvent("classic", "keypress", function (event){if (event.keyCode == 13){game_interaction();}});
onEvent("blitz", "keypress", function (event){if (event.keyCode == 13){game_interaction();}});
onEvent("long", "keypress", function (event){if (event.keyCode == 13){game_interaction();}});
onEvent("name", "keypress", function (event){if (event.keyCode == 13){game_interaction();}});

// If enter button is clicked, add point if correct.
onEvent("enter_button_classic", "click", function(){game_interaction()});
onEvent("enter_button_blitz", "click", function(){game_interaction()});
onEvent("enter_button_long", "click", function(){game_interaction()});
onEvent("enter_button_name", "click", function(){game_interaction()});


// Leaderboard
var username; var login_is_hidden=false;

// If enter button is clicked/enter key is clicked, login if the user hasn't logged in
onEvent("leaderboard", "keypress", function(event){if (event.keyCode==13 && !login_is_hidden && getText("username_input") && getText("password_input")){login()}});
onEvent("enter_button_leaderboard", "click", function(){if (!login_is_hidden && getText("username_input") && getText("password_input")){login()}});
onEvent("back_button_leaderboard", "click", function(){setScreen("menu")});

// Replay game if ctrl/button is clicked
onEvent("leaderboard", "keypress", function(event){if(event.keyCode==32 && login_is_hidden){start_game()}});
onEvent("replay_button", "click", function(){start_game()});
