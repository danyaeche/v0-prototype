// Floating screen switcher — prototype navigation helper only.
(function () {
  var screens = [
    ["login.html", "5", "Login"],
    ["signup.html", "6", "Sign up"],
    ["parts.html", "1", "Parts"],
    ["part-detail.html", "2", "Part detail"],
    ["supplier-portal.html", "3", "Supplier"],
    ["quote-submission.html", "4", "Quote"],
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
