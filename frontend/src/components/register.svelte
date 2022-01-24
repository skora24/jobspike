<script>
    //import { goto } from '@sapper/app';
    let name = '', email = '', password = ''
    const submit = async() => {
        await fetch('http://localhost:8899/api/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name,
                email,
                password
            })
        });
        return this.redirect(301, '/login')
        //goto('/login');
    }
</script>
<div class='darkgreen loginbox'>
    <div class='logowanie'>
        <div class='top lightgreen'>
            <h1>Rejestracja w jobspike</h1>
        </div>
        <form on:submit|preventDefault={submit}>
        <div class='bottom green'>
            <div class='mail'>
                <label for='mail'>Name</label>
                <input bind:value={name} id='mail'>                
            </div>
            <div class='mail'>
                <label for='mail'>E-mail</label>
                <input bind:value={email} type='email' id='mail'>                
            </div>
            <div class='haslo'>
                <label for='haslo'>Hasło</label>
                <input bind:value={password} type='password' id='haslo'>  
            </div>
            <div class='accept'>
                <input type='checkbox' id='accept'>
                <label for='accept'><a href='...'>Akceptuję regulamin serwisu</a></label>
            </div>
            <div class='guziki'>
                <div class='guzikbox1'>
                    <button id='login' type='button' onclick="window.location.href='#/login'">Mam już konto</button>
                </div>
                <div class='guzikbox2'>
                    <button id='rejestr' type='submit' >Zarejestruj</button>
                </div>
            </div>
        </div>
        </form>
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
        padding: 2vh 3vw 2vh 3vw;
    }
    .repeat{
        padding: 2vh 3vw 2vh 3vw;
    }
    .guzikbox1{
        display: flex;
    }
    .guzikbox2{
        display: flex;
    }
    .guziki #login{
        margin: 4vh auto 2vh auto;
        background-color: #00cc00;
        color:white;
        border: 1px;
        border-color: white;
        border-radius: 5px;
    }
    .guziki #rejestr{
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
    .accept{
        display:inline-flex;
        padding: 2vh 3vw 4vh 3vw;
    }
    .accept input{
        width:3vh;
        height:3vh;
    }
    .accept label{
        margin-top:2vh;
        margin-left:2vw;
    }
    .accept a{
        color:wheat;
    }
</style>