// Floating screen switcher — prototype navigation helper only (skipped on Figma import).
(function () {
  var screens = [
    ["overview.html", "1", "Dashboard"],
    ["projects.html", "2", "Projects"],
    ["project-detail.html", "3", "Project detail"],
    ["parts-list.html", "4", "Parts"],
    ["part-detail.html", "5", "Part detail"],
    ["issues-list.html", "6", "Issue inbox"],
    ["issue-detail.html", "7", "Issue detail"],
    ["revision-history.html", "8", "Revision history"],
    ["revision-diff.html", "9", "Revision compare"],
    ["magic-link-view.html", "R", "Reviewer portal"],
    ["activity.html", "A", "Activity"],
    ["notifications.html", "N", "Notifications"],
    ["team.html", "T", "Team"],
    ["magic-links.html", "K", "Magic links"],
    ["settings.html", "G", "Settings"],
    ["create-project.html", "+", "New project"],
    ["user-flow.html", "F", "Workflow"],
    ["login.html", "L", "Login"],
    ["signup.html", "S", "Sign up"],
  ];
  var here = location.pathname.split("/").pop() || "login.html";
  var el = document.createElement("div");
  el.className = "switcher";
  el.setAttribute("data-figma-skip", "true");
  el.innerHTML =
    '<span class="lbl">Screens</span>' +
    screens
      .map(function (s) {
        var active = s[0] === here ? ' style="background:rgba(255,255,255,.16);color:#fff"' : "";
        return '<a href="' + s[0] + '" title="' + s[2] + '"' + active + ">" + s[1] + "</a>";
      })
      .join("");
  document.body.appendChild(el);
})();
