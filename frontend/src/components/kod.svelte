<div class='green forgot'>
    <h1>Wysłaliśmy kod na twój e-mail</h1>
    <label for='kod'>Kod</label>
    <input id='kod' type='number'>
    <div class='guzik'>
       <button on:click={cos}>Potwiedź kod</button>
    </div>
</div>
<style>
.green{
    background-color: #00ff00;
}
.forgot{
    margin:10vh 20vw 0 20vw;
    color:white;
}
h1{
    padding:3vh 0 15vh 0;
    text-align: center;
    font-size: 6vh;
}
label{
    font-size: 4vh;
    padding:0 3vw 2vh 3vw;
}
input{
    margin:0 3vw 10vh 3vw;
    width:54vw;
}
input:focus{
    outline:none;

}
input:invalid{
    border:3px solid red;
}
.guzik{
    text-align: center;
}
button{
    color:white;
    background-color: #00cc00;
    font-size: 4vh;
    border-radius:20px;
    border-color: #00cc00;
}
</style>