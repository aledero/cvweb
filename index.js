function toggleTheme() {
    const body = document.getElementsByTagName("body")[0]
    const toggleIcon = document.getElementById("themeToggleIcon")
    console.log(body.className)
    if (body.className === "light-theme") {
        toggleIcon.className = "fa-solid fa-xl fa-toggle-on"
        body.className = "dark-theme"
    } else {
        toggleIcon.className = "fa-solid fa-xl fa-toggle-off"
        body.className = "light-theme"
    }
}