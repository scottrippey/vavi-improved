javascript:
(function(){
    var myTeam = "Finger Puppet Mafia";
    var myNextGameTime = "(unknown)";
    var myNextOpponent = "(unknown)";

    /* fmt */
    function fmt(format, args){ return format.replace(/{([\w]+)}/g, function (m, index) { return args[index]; }); };

    /* Find the team info */
    var colors = {
        "Light Blue":"#88EEFF"
        ,"Royal":"#8888FF"
        ,"White":"#FFCCFF"
        ,"Green":"#33CC33"
        ,"Orange":"#FF6600"
        ,"Black":"#999999"
        ,"Yellow":"#FFFF00"
        ,"Red":"#FF6666"
        ,DateSplit:"#000099"
        ,NextGame:"#CCCCFF"
        ,"No Color":""
        };
    var teams = {};
    $("[name=team_id]").find("option").slice(1).each(function(){
        var teamInfo = {};
        var team = $(this).text();
        teamInfo.Name = team;
        var colorName = (/[(](.+)[)]/).exec(team);
        teamInfo.ColorName = (colorName ? colorName[1] : "No Color");
        teamInfo.Color = colors[teamInfo.ColorName];
        team = $.trim(team.split(" (")[0]);
        teamInfo.Class = team.replace(/\W/g, "");
        teamInfo.Wins = 0;
        teamInfo.Loss = 0;
        teams[team] = teamInfo;
    });

  /* Extract the results */
    var lastDate = "";
    var nextGame = "";
	var results = $("tr.even, tr.odd").map(function(){
        var result = {};
        var td = $(this).find("td");
        result.Date = td.eq(0).text();
        result.Time = td.eq(1).text();
        result.TeamA = td.eq(2).text();
        result.TeamB = td.eq(3).text();
        if (lastDate != result.Date) {
            lastDate = result.Date;
            $(this).css("border-top","2px solid " + colors.DateSplit);
        }
		/* Ignore unrecognized teams: */
		if (!teams[result.TeamA] || !teams[result.TeamB]) return null;
        
        /* Find the next game date: */
        var resultDate = new Date(result.Date);
        resultDate.setFullYear(resultDate.getFullYear() + 100); /* Fix Y2K issue */
        resultDate.setHours(21); /* Games are done at 10 */
        if (nextGame == "" && resultDate >= new Date()) {
            nextGame = result.Date;
        }
        if (result.Date == nextGame) {
            $(this).css("background-color",colors.NextGame);
            if (result.TeamA == myTeam || result.TeamB == myTeam){
                myNextGameTime = result.Time;
                myNextOpponent = (result.TeamA == myTeam) ? result.TeamB : result.TeamA;
            }
        }
        
        var scores = td.eq(5).text().split("-");
        if (isNaN(scores[0])) result.TBP = true;
        result.ScoreA = Number(scores[0]);
        result.ScoreB = Number(scores[1]);
        /* Add classes */
        result.td = td;
        td.eq(2).addClass("team " + teams[result.TeamA].Class);
        td.eq(3).addClass("team " + teams[result.TeamB].Class);
        return result;
	});

	/* Count Wins/Losses */
    var games = 0;
    lastDate = "";
    results.each(function(x,result){
        if (result.TBP) return;
        teams[result.TeamA].Wins += result.ScoreA;
        teams[result.TeamA].Loss += result.ScoreB;
        teams[result.TeamB].Wins += result.ScoreB;
        teams[result.TeamB].Loss += result.ScoreA;
        if (lastDate !== result.Date) {
            lastDate = result.Date;
            games++;
        }
    });

    /* Sort the list */
    var sort = [];
    for (var team in teams){
        var i;
        for (i=0; i<sort.length; i++){
            if (teams[team].Wins > teams[sort[i]].Wins) break;
            if (teams[team].Wins == teams[sort[i]].Wins) {
                /* Tie Breaker: Who beat whom? */
                var teamScore = 0;
                results.each(function(x,result){
                    if (result.TBP) return;
                    if (result.TeamA == team && result.TeamB == sort[i]) teamScore += result.ScoreA - result.ScoreB;
                    if (result.TeamB == team && result.TeamA == sort[i]) teamScore += result.ScoreB - result.ScoreA;
                });
                if (teamScore > 0) break;
            }
        }
        sort.splice(i,0,team);
    }

    /* Output the results */
    var msg = $(fmt(
                "<div style='position:fixed; top: 20px; left: 20px; padding: 0 10px 10px; z-index:100; border: 4px solid #000099; background: #dddddd'>"
                    +"<h3>Vavi Team Rankings</h3>"
                    +"<h4>{0} games played so far</h4>"
                    +"<p style='background:{4}'><b class='perm team {7}'>{1}</b>'s next game:<br /><b>{2}</b> on <b>{3}</b> against <b class='perm team {6}'>{5}</b></p>"
                    +"<table><tr style='font-weight:bolder;'><td> Rank </td><td> Team </td><td> Wins </td><td> Losses </td></tr></table>"
                    +"<h3>Roster</h3>"
                    +"<div id='Roster'></div>"
                    +"<h3>Let's go {1}!!!</h3>"
                +"</div>"
                ,[
                    games
                    ,myTeam
                    ,myNextGameTime
                    ,nextGame
                    ,colors.NextGame
                    ,myNextOpponent
                    ,teams[myNextOpponent] && teams[myNextOpponent].Class
                    ,teams[myTeam].Class
                ]));
    var table = msg.find("table");
    for (var i=0; i<sort.length; i++){
        var team = sort[i];
        if (team == "") continue;
        table.append(fmt("<tr class='{4}'><td>#{0}</td><td>{1}</td><td>{2}</td><td>{3}</td></tr>",[
                        (i+1)
                        ,teams[team].Name
                        ,teams[team].Wins
                        ,teams[team].Loss
                        ,"perm team " + teams[team].Class
                        ]));
    }
    msg.hide().appendTo($("body")).show("slow");

	/* highlight winners */
	results.each(function(x,result){
		if (result.TBP) return;
		result.td.eq((result.ScoreA > result.ScoreB)?2:3).css("font-weight","bolder");
		result.td.eq(5).html(fmt( (result.ScoreA > result.ScoreB) ? "<b class='{2}'>{0}</b> - <span class='{3}'>{1}</span>" : "<span class='{2}'>{0}</span> - <b class='{3}'>{1}</b>" ,[
																 result.ScoreA
																 ,result.ScoreB
																 ,"team " + teams[result.TeamA].Class
																 ,"team " + teams[result.TeamB].Class
																 ]));
	});

	/* hook up team highlighting */
    for (var team in teams) {
        (function(team){
            $(".team." + teams[team].Class).bind("mouseover click", function(e){
                if (!e.ctrlKey) $(".team").not(".perm").css("background","");
                $(".team." + teams[team].Class).css("background",teams[team].Color);
                $("#Roster").html(teams[team].Roster && teams[team].Roster.join("<br />") || "Retrieving Roster...").css("background",teams[team].Color);
            });
        })(team);
        $(".perm.team." + teams[team].Class).css("background",teams[team].Color);
    }
    if (teams[myTeam]) $(".team." + teams[myTeam].Class).click();
    $(".team").css("cursor","pointer").click(function(){$(".team").unbind("mouseover");});



    /* retrieve the roster via Ajax */
    var league_id = (/league_id=(\d+)/).exec(window.location)[1];
    $.get("http://www.govavi.com/rosters.php", {league_id:league_id}, function(roster) {
            /* Find the roster entries (thanks vavi for the sea of tables) */
            roster = $(roster)
                .find("font:contains('Team captains')")
                .children("table:eq(1)")
                .find("font")
            ;
            /* Build the roster: */
            var team = "";
            roster.each(function(){
                var text = $(this).html();
                switch ($(this).attr("size")) {
                    case "4":
                        /* ignore Color */
                        if (text.indexOf("Color") == 0) return; 
                        
                        /* Team name */
                        team = text;
                        teams[team].Roster = [];
                        break;
                    case "2":
                        /* player name */
                        teams[team].Roster.push(text);
                        break;
                }
            });
            
            /* Update the roster: */
            if (teams[myTeam]) $(".team." + teams[myTeam].Class).mouseover();
    });

})();
