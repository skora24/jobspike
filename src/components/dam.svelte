<div class='kontent'>
    <h1>Szukam pracownika</h1>
    <div class='search'>
        <input type="search"id='search' placeholder="Szukaj..."/>
        <button type='submit'>></button>
    </div>
    <div class='filtry'>
        <script>
            function menu(){
                var x = document.getElementById("zmiana");
                if (x.style.display === "none"){
                    x.style.display = "block"
                } else {
                    x.style.display = "none"
                }
            }
        </script>
        <button type='submit'  on:click={menu}>Filtry</button>

        <div class='darkgreen zmienfiltry row mb-3' id='zmiana' style='display: none;'>
            <div class='wymiar'>
                <label for='wymiar'>Wymiar pracy</label>
                <select id='wymiar'>
                    <option value='1'>Pełen etat</option>
                    <option value='2'>Dodatkowa / Sezonowa</option>
                    <option value='3'>Niepełny etat</option>
                    <option value='4'>Praktyka / Staż</option>
                </select>
            </div>

            <div type='typ'>
                <label for='typ'>Typ umowy</label>
                <select id='typ'>
                    <option value='1'>Umowa o pracę</option>
                    <option value='2'>Umowa zlecenie</option>
                    <option value='3'>Umowa o dzieło</option>
                    <option value='4'>Samozatrudnienie</option>
                    <option value='5'>Inne</option>
                </select>
            </div>
            <div class='miejscowosc'>
                <label for='miejscowosc'>Miejscowość</label>
                <input id='miejscowosc'>
            </div>
            <div class='opisy'>
                <label for='opisy'>Szukaj w opisach</label>
                <input id='opisy' type='checkbox'>
            </div>
            <div class='stanowiska'>
                <label for='stanowiska'>Szukaj w stanowiskach</label>
                <input type='checkbox'>
            </div>
            <div class='sortuj'>
                <label for='sortuj'>Sortuj od:</label>
                <select id='sortuj'>
                    <option value='1'>Najowszych</option>
                    <option value='2'>Najstarszych</option>
                </select>
            </div>
            <button id='zatwierdz'>Zatwierdź</button>
        </div>
    </div>
    <div class='ogloszenia'>
    </div>
</div>
<footer>
    <p>Support: help.jobspike@gmail.com</p>
</footer>
<style>
    .kontent{
        margin: 5vh 5vw 0 5vw;
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
    h1{
        font-size: 7vh;
        font-weight: 500;
    }
    .search{
        display:inline;
        text-align: right;
    }
    .search input{
        margin: 3vh 0 1vh 0;
        border-radius: 20px;
        width:80vw;
        border: 3px solid;
        border-color: #00ff00;
    }
    .search button{
        width:10wv;
        border-color: #00ff00;
        background-color: #00ff00;
        color:white;
        border-radius:20px;
    }
    .filtry button{
        width:10wv;
        font-size: 4vh;
        border-color: #00cc00;
        background-color: #00cc00;
        color:white;
        border-radius:20px;
    }
    .darkgreen{
        background-color: #00cc00;
    }
    .zmienfiltry{
        
        color:white;
        min-width: 300px;
        margin-left:0.125vh;
        border-radius:20px;
        padding: 2vh 2vh 2vh 2vh;
    }
    .zmienfiltry label{
        margin-bottom: 1vh;
    }
    .opisy{
        display:inline-flex;
    }
    .stanowiska{
        display: inline-flex;
    }
    select{
        background-color: white;
        border-radius:20px;
        border: 3px solid #00cc00;
    }
    select:focus{
        outline:none;
    }
    .miejscowosc input{
        background-color: white;
        border-radius:20px;
        border: 3px solid #00cc00; 
    }
    .miejscowosc input:focus{
        outline: none;
    }
    .opisy label{
        margin-right: 2vw;
    }
    .stanowiska label{
        margin-right: 2vw;
    }
    #zatwierdz{
        border-color: #00ff00;
        background-color: #00ff00;
        color:white;
        border-radius:20px;
    }
</style>