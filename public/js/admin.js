// ----------- FASTPAYZONE ADMIN PANEL JS -----------

const API_BASE = "https://fastpayzone.onrender.com";

// quick notify
function msg(t){
    const m = document.getElementById("adminMsg");
    if(m){
        m.innerText = t;
        setTimeout(()=>{ m.innerText=""; }, 4000);
    }
    console.log("ADMIN:", t);
}

// -------- FETCH ALL USERS ----------
async function loadUsers(){
    try{
        const r = await fetch(API_BASE + "/api/admin/users");
        const j = await r.json();
        const box = document.getElementById("usersTable");
        box.innerHTML = "";

        j.users.forEach(u=>{
            box.innerHTML += `
                <tr>
                    <td>${u.id}</td>
                    <td>${u.name}</td>
                    <td>${u.phone}</td>
                    <td>₹${(u.wallet||0).toFixed(2)}</td>
                </tr>
            `;
        });
    }catch(e){
        msg("Users fetch error");
    }
}

// -------- FETCH DEPOSITS ----------
async function loadDeposits(){
    try{
        const r = await fetch(API_BASE + "/api/admin/deposits");
        const j = await r.json();
        const box = document.getElementById("depTable");
        box.innerHTML = "";

        j.deposits.forEach(d=>{
            box.innerHTML += `
                <tr>
                    <td>${d.id}</td>
                    <td>${d.user_id}</td>
                    <td>₹${d.amount}</td>
                    <td>${d.paid_to_upi}</td>
                    <td><span class="badge ${d.status=='pending'?'badge-pending':'badge-success'}">${d.status}</span></td>
                    <td>
                        <button class="btn" onclick="approveDeposit(${d.id})">Approve</button>
                    </td>
                </tr>
            `;
        });
    }catch(e){
        msg("Deposit fetch error");
    }
}

// -------- APPROVE DEPOSIT ----------
async function approveDeposit(id){
    if(!confirm("Approve deposit ID: "+id+" ?")) return;

    try{
        const r = await fetch(API_BASE + "/api/admin/deposit/approve", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ id })
        });

        const j = await r.json();
        if(j.ok){
            msg("Deposit approved");
            loadDeposits();
            loadUsers();
        } else {
            msg("Error approving deposit");
        }
    }catch(e){
        msg("Network error");
    }
}

// -------- FETCH WITHDRAWALS ----------
async function loadWithdrawals(){
    try{
        const r = await fetch(API_BASE + "/api/admin/withdraws");
        const j = await r.json();
        const box = document.getElementById("withTable");
        box.innerHTML = "";

        j.withdraws.forEach(w=>{
            box.innerHTML += `
                <tr>
                    <td>${w.id}</td>
                    <td>${w.user_id}</td>
                    <td>₹${w.amount}</td>
                    <td>${w.payout_upi}</td>
                    <td><span class="badge ${w.status=='pending'?'badge-pending':'badge-success'}">${w.status}</span></td>
                    <td>
                        <button class="btn" onclick="approveWithdraw(${w.id})">Approve</button>
                    </td>
                </tr>
            `;
        });
    }catch(e){
        msg("Withdraw fetch error");
    }
}

// -------- APPROVE WITHDRAW ----------
async function approveWithdraw(id){
    if(!confirm("Approve withdraw ID: "+id+" ?")) return;

    try{
        const r = await fetch(API_BASE + "/api/admin/withdraw/approve", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ id })
        });

        const j = await r.json();
        if(j.ok){
            msg("Withdraw approved");
            loadWithdrawals();
            loadUsers();
        } else {
            msg("Error approving withdraw");
        }
    }catch(e){
        msg("Network error");
    }
}

// load all data at start
function loadAll(){
    loadUsers();
    loadDeposits();
    loadWithdrawals();
}
  
