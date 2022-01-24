<div class='dam'>
    <div class='tytul'>
        <h1>Dam prace</h1>
    </div>
    <div class='inputs'>
        <div class='nazwa'>
            <label for='nazwa'>Nazwa ogłoszenia</label>
            <input type='text' id='nazwa'/>
        </div>
        <div class='wymiar'>
            <label for='wymiar'>Wymiar pracy</label>
            <select id='wymiar'>
                <option value='1'>Pełen etat</option>
                <option value='2'>Dodatkowa / Sezonowa</option>
                <option value='3'>Niepełny etat</option>
                <option value='4'>Praktyka / Staż</option>
            </select>
        </div>
        <div class='typ'>
            <label for='typ'>Typ umowy</label>
            <select id='typ'>
                <option value='1'>Umowa o pracę</option>
                <option value='2'>Umowa zlecenie</option>
                <option value='3'>Umowa o dzieło</option>
                <option value='4'>Samozatrudnienie</option>
                <option value='5'>Inny</option>
            </select>
        </div>
        <div class='stanowisko'>
            <label for='stanowisko'>Stanowisko</label>
            <input type='text'id='stanowisko'/>
        </div>
        <div class='placa'>
                <label for='placa1'>Płaca</label>
                <div class='oddo'>
                    <p class='od'>Od</p>
                    <input type='number' id='placa1'>
                    <p class='do'>do</p>
                    <input type='number' id='placa2'>
                </div>
                <label for='format_placy'>Format płacy</label>
                <input type='text' id='format_placy' placeholder="np. brutto/mies"/>
        </div>
        <div class='miejscowosc'>
            <label for='miejscowosc'>Miejscowosc</label>
            <input id='miejscowosc'/>
        </div>
        <div class='opis'>
            <label for='opis'>Opis</label>
            <textarea id='opis'></textarea>
        </div>
        <h2>Kontakt</h2>
        <div class='numer'>
            <label for='numer'>Numer telefonu</label>
            <input type='number'id='numer'/>
        </div>
        <div class='email'>
            <label for='email'>Adres e-mail</label>
            <input id='email'/>
        </div>
        <div class='submit'>
            <button type='submit'>Dodaj ogłoszenie</button>
        </div>
    </div>
</div>
<footer>
    <p>Support: help.jobspike@gmail.com</p>
</footer>
<style>
    h1{
        font-weight: 500;
        margin: 5vh 5vw 0 5vw;
        font-size: 7vh;
    }
    .inputs div{
        margin: 3vh 5vw 0 5vw;
    }
    h2{
        font-weight: 500;
        margin: 3vh 5vw 0 5vw;
        font-size: 6vh;
    }
    label{
        margin-bottom: 2vh;
        font-size: 4vh;
    }
    input{
        border-radius: 20px;
        width:100%;
        border: 3px solid;
        border-color: #00ff00;
    }
    input:focus{
        outline:none;
    }
    textarea{
        min-height: 20vh;
        border-radius: 20px;
        width:100%;
        border: 3px solid;
        border-color: #00ff00;
    }
    textarea:focus{
        outline:none;
    }
    select{
        background-color: white;
        border-radius: 20px;
        width:100%;
        border: 3px solid;
        border-color: #00ff00;
    }
    select:focus{
        outline:none;
    }
    .od{
        margin-top: -2vh;
        font-size: 4vh;
        margin-left: -5vw;
        margin-right: 1vw;
    }
    .do{
        margin-top: -2vh;
        font-size: 4vh;
        margin-left: 1vw;
        margin-right: 1vw;
    }
    .oddo{   
        display:inline-flex;
    }
    .oddo input{
        margin-top: -3vh;
        margin-bottom: 3vh;
    }
    .submit{
        text-align: center;
    }
    button{
        background-color:#00cc00;
        color:white;
        padding-left: auto;
        padding-right: auto;
        margin: 5vh auto 10vh auto;
        border: 1px;
        border-color: white;
        border-radius: 5px;
        font-size: 6vh;
    }
    button:active{
        background-color: black;
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
</style>