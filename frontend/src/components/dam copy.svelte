<div class='kontent'>
    <h1>Szukam pracy</h1>
    <div class='search'>
        <input type="search"id='search' placeholder="Szukaj..."/>
        <button type='submit'>></button>
    </div>
    <div class='filtry'>
        <button type='submit'>Filtry</button>
        <div class='darkgreen zmienfiltry'>
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
        </div>
    </div>
    <div class='ogloszenia'>
        {#each ogloszenia as ogloszenia}
            <div class='miniogloszenie'>
                <div class='minilewo'>
                    <h2 class='ogloszenietitle'>{ogloszenie.nazwa}</h2>
                    <div class='miniinfo'>
                        <p class='ogloszeniemiejscowosc'>{ogloszenie.miejscowosc}</p>
                        -
                        <p class='ogloszeniedata'>{ogloszenie.data}</p>
                        -
                        <p class='ogloszeniewymiar'>{ogloszenie.wymiar_pracy}</p>
                        -
                        <p class='ogloszenietyp'>{ogloszenie.typ_umowy}</p>
                    </div>
                </div>
                <div class='miniprawo'>
                    <p class='ogloszeniestanowisko'>{ogloszenie.stanowisko}</p>
                    <div class='ogloszenieplaca'>
                     <p class='ogloszenieplaca1'>{ogloszenie.placa1}</p>
                     <p class='ogloszenieplaca2'>{ogloszenie.placa2}</p>
                     <p class='ogloszenieplacaformat'>{ogloszenie.format_placy}</p>
                    </div>
                </div>
            </div>
        {/each}
    </div>
</div>
<footer>
    <p>Support: help.jobspike@gmail.com</p>
</footer>