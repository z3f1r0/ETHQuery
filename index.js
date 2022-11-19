// JavaScript file - Contacting Ethereum blockchain with API
let api_key = "dg0O8jwSY8l7tyqXD7yby71bpJeq8x--"; // API key from alchemy
const form = document.getElementById('form'); // Get form from id
var pager; // Pager Constructor's Object

// Waiting for 'submit' to send data to the fetch() function
// function 'e' is a default function just to handle data submission
form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Getting value of 'address' key ===> Form --> entries: {0:[key:vaue], 1:[], 2[], ...}
    //  and put that value on a const called wallet that represent the real wallet address
    //  notice that method get() takes input by name not by id
    var wallet = new FormData(form).get('address')
    if(wallet == "" || wallet == null){
        console.log("Chosing from ethleaderboard...") // Just to debug
        var wallet = new FormData(form).get('selection')
    }

    // Get value of number of transaction we want to visualiza
    let num_tx = document.querySelector('input[name="num_Tx"]:checked').value;
    //console.log("tx per page: "+parseInt(num_tx)) //debug

    var min = new FormData(form).get('min_value') // Get minimum Value to visualize
    
    async function requestData() {
        // Start of the CURL converted to fetch() function
        const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${api_key}`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                'id': 1,
                'jsonrpc': '2.0',
                'method': 'alchemy_getAssetTransfers',
                'params': [
                    {
                        'fromBlock': '0x0',
                        'toBlock': 'latest',
                        'fromAddress': wallet,
                        'category': [
                            'external', 'internal', 'erc20', 'erc721', 'erc1155', 'specialnft'
                        ],
                        'withMetadata': false,
                        'excludeZeroValue': true,
                        'maxCount': '0x3e8' // ---> length = 1000 by default
                    }
                ]      
            })     
        });

        if (!response.ok) {
            const message = `An error has occured: ${response.status}`;
            throw new Error(message);
          };
        
        // Extracting JSON object from fetch response
        // the requestData() method returns a promise, so I have to wait for the JSON: await response.json()
        const resJSON = await response.json();
        return resJSON;
    }

    // Promise
    requestData().then(resJSON => {
        //console.log(JSON.parse(JSON.stringify(resJSON))); // fetched res - just to debug
        //var respons = JSON.parse(resJSON)
        //console.log(respons.transfers[0].blockNum); // debugging resJSON response

        // Structure of resJSON -> '{"result": {"transfers": {"ARRAY(NUM)": "blockNum":value, "hash": value, "from": value, "to": value, "value": value, "asset": value}}}

        var obj = JSON.parse(JSON.stringify(resJSON)); // Parsing JSON objects  

        createTable(); // createTable() function call 
        
        if(obj.result.transfers.length==0){
            alert("The aren't any transactions from this wallet!")
        }
        
        // Processing data
        let c=0 // counter effective output tx
        for (var i=0; i<obj.result.transfers.length; i++){ // length = 1000
            if(obj.result['transfers'][i].value > min){ // Filter result for Value
                appendTx(obj.result['transfers'][i]); // Appends every row to the table
                c++;
            }
            //console.log(obj.result['transfers'][i]) // debug
        } // end of for cycle
        
        //console.log("min value: "+parseInt(min)) // debug
        //console.log("tx in output: "+parseInt(c)) // debug

        /// Section to change Value dinamically
        /// Pagination section code is redundant but it works
        document.getElementById("min_value").addEventListener("change", changeVal); // Event on change selection

        async function changeVal() {
          let v = document.getElementById("min_value").value;
          //console.log("new min val: "+v) // debug
          clear("tx") // Clears table body
          createTable(); // createTable() function call
          // Re-processing data
            let k=0; //counter
            for (var i=0; i<obj.result.transfers.length; i++){ 
                if(obj.result['transfers'][i].value > v){ // Filter result for Value
                    appendTx(obj.result['transfers'][i]); // Appends every row to the table
                    k++;
                }
            } // end of for cycle

            //console.log("new tx in output: "+parseInt(k)) // debug

            // Pagination section
            pager = new Pager('idTable', parseInt(num_tx)); // Creates Pager Objecy

            if(parseInt(k) > parseInt(num_tx)){
                pager.init();
                pager.showPageNav('pager', 'pageNavPosition');
                pager.showPage(1)
            }

            if(num_tx == "" || num_tx > parseInt(k)){
                clear("pageNavPosition") // clear pageNavPosition div
            }
            
        } // End of changeVal() function        

        // Pagination section
        pager = new Pager('idTable', parseInt(num_tx)); // Creates Pager Object

        if(parseInt(c) > parseInt(num_tx)){
            pager.init();
            pager.showPageNav('pager', 'pageNavPosition');
            pager.showPage(1)
        }

        if(num_tx == "" || num_tx > parseInt(c)){
            clear("pageNavPosition") // clear pageNavPosition div
        }

    }) // end of promise
    .catch(error => {
        error.message; // 'An error has occurred'
        console.log(error.message)
        alert(error.message+".\n\n Try again!")
      });    

}) //end of add.EventListener

// Clear div/ID element function
const clear = (elementID) => {
    document.getElementById(elementID).innerHTML = "";
};

// Creating dinamyc table div
const tableDiv = document.querySelector("div.tx") // Finds div table in html file
let tableHeaders = ["BlockNum", "Hash", "From Address", "To Address", "Value", "Assett"]; // Creates table headers

const createTable = () => {
    while(tableDiv.firstChild) tableDiv.removeChild(tableDiv.firstChild) // Removes all childrem from table div (if any)
    
    let txTable = document.createElement('table') // Creates table
    txTable.className = 'txTable'
    txTable.id = 'idTable'

    let txTableHead = document.createElement('thead') // Creates the table header group element 
    txTableHead.className = 'txTableHead'

    let txTableHeaderRow = document.createElement('tr') // Creates the row that will contain the headers
    txTableHeaderRow.className = 'txTableHeaderRow'

    // Will iterate over all the strings in the tableHeaders array and will append the header cells to the table header row
    tableHeaders.forEach(header => {
        let txHeader = document.createElement('th') // Creates the current header cell during a specific iteration
        txHeader.innerText = header
        txTableHeaderRow.append(txHeader) // Appends the current header cell to the header row
    })

    txTableHead.append(txTableHeaderRow) // Appends the header row to the table header group element
    txTable.append(txTableHead) 
    
    let txTableBody = document.createElement('tbody') // Creates the table body group element
    txTableBody.className = 'txTable-Body'
    txTableBody.id = 'txTable-Body'
    txTable.append(txTableBody) // Appends the table body group element to the table

    tableDiv.append(txTable) // Appends the table to the table div

} // end of createTable() function

// The function below will append a single transaction
// singleTx represents a single Tx from blockchain and corresponds to the Tx Array received from resJSON
const appendTx = (singleTx) => { 
    const txTable = document.querySelector('.txTable') // Finds the table I created

    let txTableBodyRow = document.createElement('tr') // Creates current table row
    txTableBodyRow.className = 'txTableBodyRow'

    // Create column cells which will appended to the current table row
    // Remember that every transaction's element are called here
    let txblockNum = document.createElement('td')
    txblockNum.innerText = singleTx.blockNum

    let txHash = document.createElement('td')
    var link = document.createElement('a') // Creates <a> element
    link.setAttribute('href', `https://etherscan.io/tx/${singleTx.hash}`) // Set href to <a> element
    link.setAttribute('target', "_blank") // Open in other tab
    link.text="TxId" // Set text for <a> element
    txHash.appendChild(link) // Incapsulate link attribute (<a>) inside td element
    //txHash.innerText = singleTx.hash

    let txFrom = document.createElement('td')
    txFrom.innerText = singleTx.from

    let txTo = document.createElement('td')
    txTo.innerText = singleTx.to

    let txValue = document.createElement('td')
    txValue.innerText = singleTx.value

    let txAsset = document.createElement('td')
    txAsset.innerText = singleTx.asset

    txTableBodyRow.append(txblockNum, txHash, txFrom, txTo, txValue, txAsset) // Appends cells to table row

    txTable.append(txTableBodyRow) // Appends current row to the tx table body

} // end of appendTx(singleTx)

// Create a Constructor Pager for pagination function and its methods
function Pager(tableName, itemsPerPage) {

    this.tableName = tableName;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
    this.pages = 0;
    this.inited = false;

    this.showTx = (from, to) => { // Shows rows
        let rows = document.getElementById(tableName).rows;

        // i starts from 1 to skip table header row
        for (let i = 1; i < rows.length; i++) {
            if (i < from || i > to) {
                rows[i].style.display = 'none';
            } else {
                rows[i].style.display = '';
            }
        }
    }; // End of showTx() functiom

    this.showPage = (pageNumber) => { // Shows current or selected page
        if (!this.inited) {
            // Not initialized
            return;
        }

        let oldPageAnchor = document.getElementById('pg' + this.currentPage);
        oldPageAnchor.className = 'pg-normal';

        this.currentPage = pageNumber;
        let newPageAnchor = document.getElementById('pg' + this.currentPage);
        newPageAnchor.className = 'pg-selected';

        let from = (pageNumber - 1) * itemsPerPage + 1;
        let to = from + itemsPerPage - 1;
        this.showTx(from, to);

        let pgNext = document.querySelector('.pg-next');
        let pgPrev = document.querySelector('.pg-prev');

        if (this.currentPage == this.pages) {
            pgNext.style.display = 'none';
        } else {
            pgNext.style.display = '';
        }

        if (this.currentPage === 1) {
            pgPrev.style.display = 'none';
        } else {
            pgPrev.style.display = '';
        }
    }; // end of showPage() function

    this.prev = () => { // Shows previous page
        if (this.currentPage > 1) {
            this.showPage(this.currentPage - 1);
        }
    };

    this.next = () => { // Show next page
        if (this.currentPage < this.pages) {
            this.showPage(this.currentPage + 1);
        }
    };

    this.init = () => { // Computes number of pages
        let rows = document.getElementById(tableName).rows;
        let records = (rows.length - 1);
        this.pages = Math.ceil(records / itemsPerPage);
        this.inited = true;
        //console.log("num pages: " +this.pages) // debug
    };

    this.showPageNav = (pagerName, positionId) => {
        if (!this.inited) {
            // Not initialized
            return;
        }

        let element = document.getElementById(positionId)
        let pagerHtml = '<span onclick="' + pagerName + '.prev();" class="pg-normal pg-prev">&#171;</span>';

        for (let page = 1; page <= this.pages; page++) {
            pagerHtml += '<span id="pg' + page + '" class="pg-normal pg-next" onclick="' + pagerName + '.showPage(' + page + ');">' + page + '</span>';
        }

        pagerHtml += '<span onclick="' + pagerName + '.next();" class="pg-normal">&#187;</span>';

        element.innerHTML = pagerHtml;
    }; // End of showPageNav()

} // End of Pager Constructor
