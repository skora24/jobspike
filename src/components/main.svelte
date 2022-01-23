
<div class='navigate'>
    <img src='/graphic/jobspikelogolong.svg' alt='jobspike logo' id='logo'>
    <div class='upperspace'></div>
    <div class='logbutt'>
        <button class='logreg' type='button' onclick="window.location.href='#/login'">Zaloguj</button>
        <button class='logreg' type='button' onclick="window.location.href='#/rejestr'">Rejestracja</button>
    </div>
</div>
<div class='welcome'>
    <h1>Witaj w serwisie jobspike!</h1>
</div>
<div class='optionmenu row mb-3'>
    <div class='optioncircle'>
        <h2>Szukam pracy</h2>
        <div class='margin-10 container'>
            <button class='ogloszbutt col-xxl-4' onclick="window.location.href='#/szukam'">Szukam ogłoszenia</button>
            <button class='ogloszbutt col-xxl-4' onclick="window.location.href='#/dodaj_szukam'">Dodaj ogłoszenie</button>
        </div>
    </div>
    <div class='optioncircle'>	
        <h2>Dam prace</h2>
        <div class='margin-10 container'>
            <button class='ogloszbutt col-xxl-4' onclick="window.location.href='#/dam'">Szukam ogłoszenia</button>
            <button class='ogloszbutt col-xxl-4' onclick="window.location.href='#/dodaj_dam'">Dodaj ogłoszenie</button>
        </div>
    </div>
</div>
<footer>
    <p>Support: help.jobspike@gmail.com</p>
</footer>
<style>
.navigate{
    display: inline-flex;
    position: static;
    background-color:hsl(120, 100%, 70%);
    width: 100%;
    height: auto;
    min-height: 8vh;
}
#logo{
    width: 30vw;
    height: auto;
}
.logreg{
    width: auto;
    background-color: #00ff00;
    border: 1px;
    border-color: white;
    border-radius: 5px;
    color: white;
    font-size: 3vw;
    height: 80%;
    width: 20vw;
    margin: auto 10px auto 10px;
    
}
.logbutt{
    display: inline-flex;
    float:right;
}
.upperspace{
    width:40vw;
}
.welcome{
    width:100%;
    position: relative;
    text-align: center;
    font-size: 10vw;
    color:#00cc00;
    padding-top: 20px;
}
.optionmenu{
    width: 100%;
    margin-top: 20px;
    position: relative;
    display: inline-flex;

}
.optioncircle{
    color:white;
    font-size: 5vw;
    padding-top: 10%;
    text-align: center;
    margin-right: auto;
    margin-left: auto;
    margin-top: 20px;
    margin-bottom: 20px;
    min-width: 250px;
    min-height: 250px;
    width: 40vw;
    height: 40vw;
    background-color: #00ff00;
    border-radius: 100vw;
}
footer{
    position: fixed;
    left:0;
    bottom: 0%;
    font-size: 2vw;
    background-color:hsl(120, 100%, 70%);;
    width: 100%;
    text-align: center;
    padding: 5px 5px;
    color: white;
}
.ogloszbutt{
    width: 85%;
    height: 100%;
    color:white;
    font-size: 2.5vw;
    border: 1px;
    border-color: white;
    border-radius: 5px;
    background-color:#00cc00;
}
.margin-10{
    margin-top: 15%;
    display:block;
}
button:active{
    background-color: black;
}
</style>