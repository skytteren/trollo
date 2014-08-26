
function scrollInto(id){
    document.getElementById(id).parentNode.scrollIntoView();
}

var onAuthorize = function() {
    updateLoggedIn();

    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    window.trollo = window.trollo || (function(){

        function loadJson(path, callback){
            Trello.get(path, callback, alert);
        }

        loadJson("/members/me", function(me){
           document.getElementById("fullName").innerHTML = me.fullName;
        });

        loadJson("/members/me/organizations", function(orgs){
           console.log("org: " + JSON.stringify(orgs));
           if(getParameterByName("org") == "" && orgs.length > 0){
               location += "?org=" + orgs[0].name;
           }
           if(orgs.length <= 1 ){
               document.getElementById("orgForm").innerHTML = "";
           }else {
               var input = document.getElementsByName("org")[0];
               input.innerHTML += "<option value='tull'>Tull</option>";
               _.forEach(orgs, function (org) {
                   input.innerHTML += "<option value='" + org.name + "'>" + org.displayName + "</option>";
               });

               document.getElementsByName("org")[0].value = getParameterByName("org");
           }
        });

        function renderCard(card, board, list, memberMap, member){
            var days = Math.floor((new Date() - new Date(card.dateLastActivity))/(1000*60*60*24));
            var g = Math.max(100 - days, 0) + 155;
            var macro = "";
            if((board.name || "").toLocaleLowerCase().indexOf("makro") > -1){
                macro = " macro";
            }
            var html = "<div class='card" + macro + "' style='background-color:rgb(" + g + "," + g + "," + g + ")'>" +
                "<a class='boardLink' href='" + board.shortUrl + "'>" + board.name + " -&gt; " + (list || {}).name + "</a> " +
                "<h3>" +
                "<a href='" + card.shortUrl + "'><span class='date'>" + days + "</span> " + card.name + "</a>" +
                "</h3>" +
                "<div>" + (_(card.idMembers).filter(function(mem){return mem !== member.id}).map(function (idMem) {
                return renderMemberLink(memberMap[idMem][0]);
            }).reduce(function (a, b) {
                return a + b;
            }) || "") +
                "</div>" +
                "<p>" + card.desc + "</p>" +
                "</div>";
            return html;
        }

        function renderMemberLink(member){
            var id = member.id;
            if(member.avatarHash){
                return '<a href="javascript:scrollInto(\'' + id + '\')"><img class="member-avatar" height="30" width="30" ' +
                    'src="https://trello-avatars.s3.amazonaws.com/' + member.avatarHash +'/30.png" ' +
                    'alt="' + member.fullName + '" title="' + member.fullName + '" /></a> ';
            } else {
                return ' <a href="javascript:scrollInto(\'' + id + '\')"><span class="member-avatar" title="' + member.fullName + '"><span>' + member.initials + '</span></span></a> ';
            }
        }

        loadJson("/organizations/" + getParameterByName("org") + "/boards?lists=open", function(boards) {

            function findBoard(idBoard) {
                return _.find(boards, function (board) {
                    return board.id === idBoard;
                });
            }


//      document.getElementById("orgs").innerHTML = JSON.stringify(boards);


            loadJson("/organizations/" + getParameterByName("org") + "/members?fields=all", function (members) {
                var memberMap = _.groupBy(members, function (mem) {
                    return mem.id
                });
                _.forEach(members, function (member) {
                    var id = member.id;
                    var linkHtml = renderMemberLink(member);
                    document.getElementById("memberLinks").innerHTML += linkHtml;

                    var html = "<a name='" + id + "' ></a>" +
                        "<div class='member'>" +
                        "<h2>" + member.fullName + "</h2>" +
                        "<span class='allcards' id='allcards" + member.id + "'>All cards</span>" +
                        "<div id='" + id + "'></div>" +
                        "</div>";
                    document.getElementById("members").innerHTML += html;
                    loadUser(member, memberMap, findBoard, true);
                });

            });
        });

        function loadUser(member, memberMap, findBoard){
            var id = member.id;
            document.getElementById(id).innerHTML = "";
            loadJson("/members/" + id + "/cards", function (cards) {
                _(cards).sortBy(function (card) {
                    var board = findBoard(card.idBoard) || {};
                    var list = _.find(board.lists || [], function(list){
                        return list.id === card.idList;
                    });
                    return board.name + (10000000 + ((list || {}).pos || 0)) + "" + (card.pos + 10000000);
                }).forEach(function (card) {
                    var board = findBoard(card.idBoard) || {};
                    var list = _.find(board.lists || [], function(list){
                        return list.id === card.idList;
                    });
                    var html = renderCard(card, board, list, memberMap, member);
                    document.getElementById(id).innerHTML += html;
                });

            });
        }

        // /1/boards/[board_id]/cards
    })();
};

var updateLoggedIn = function() {
    var isLoggedIn = Trello.authorized();
    $("#loggedout").toggle(!isLoggedIn);
    $("#loggedin").toggle(isLoggedIn);
};

var logout = function() {
    Trello.deauthorize();
    updateLoggedIn();
    document.getElementById("memberLinks").innerHTML = "";
    document.getElementById("members").innerHTML = "";
};

Trello.authorize({
    interactive:false,
    success: onAuthorize
});

$("#connectLink")
    .click(function(){
        Trello.authorize({
            type: "popup",
            success: onAuthorize
        })
    });

$("#disconnect").click(logout);


document.addEventListener('touchmove',function(e) {e.preventDefault();},false);


