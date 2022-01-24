<div class='darkgreen loginbox'>
    <div class='logowanie'>
        <div class='top lightgreen'>
            <h1>Zaloguj się do jobspike</h1>
        </div>
        <div class='bottom green'>
            <div class='mail'>
                <label for='mail'>E-mail</label>
                <input type='email' id='mail' />                
            </div>
            <div class='haslo'>
                <label for='haslo'>Hasło</label>
                <input type='password' id='haslo'>  
            </div>
            <a href='#/login/forgot' class='forgot'>Nie pamietam hasła</a>
            <div class='guziki'>
                <div class='guzikbox1'>
                    <button id='regbutt' type='button' onclick="window.location.href='#/rejestr'">Nie mam konta</button>
                </div>
                <div class='guzikbox2'>
                    <button id='logbutt' type='button' >Zaloguj</button>
                </div>
            </div>
        </div>
    </div>
</div>
<style>
    .darkgreen{
        background-color: #00cc00;
    }
    .loginbox{
        padding:5vh 5vw 15vh 5vw;
        height: 80vh;
        width: 80vw;
        height: 80%;
        color: white;
        margin: 10vh auto;
    }
    .top{
        font-size: 6vh;
        padding:2vh 0 2vh 0;
        text-align: center;
    }
    .bottom{
        font-size: 3vh;
    }
    .green{
        background-color: #00ff00;
    }
    .lightgreen{
        background-color: #66ff66;
    }
    .mail{
        padding: 4vh 3vw 2vh 3vw;
    }
    input{
        width: 100%;
        margin-top: 2vh;
    }
    input:focus{
        border-color: none;
        outline:none;
    }
    .haslo{
        padding: 2vh 3vw 4vh 3vw;
    }
    .forgot{
        padding:0 3vw 4vh 3vw;
        color:wheat;
    }
    .guzikbox1{
        display: flex;
    }
    .guzikbox2{
        display: flex;
    }
    .guziki #regbutt{
        margin: 4vh auto 2vh auto;
        background-color: #00cc00;
        color:white;
        border: 1px;
        border-color: white;
        border-radius: 5px;
    }
    .guziki #logbutt{
        background-color:#00cc00;
        color:white;
        margin: 2vh auto 4vh auto;
        border: 1px;
        border-color: white;
        border-radius: 5px;
    }
    button:active{
        background-color: black;
    }
    input:invalid{
        border: 3px red solid;
    }
</style>