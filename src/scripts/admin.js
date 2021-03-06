let sendAjaxRequest = function(method, path, args, callback) {
    let ajaxRequest = new XMLHttpRequest();
    ajaxRequest.overrideMimeType("application/json");
    ajaxRequest.onreadystatechange = callback;
    ajaxRequest.open(method, path, true);
    ajaxRequest.send(args);
};

document.getElementById("feedback_button").onclick = function () {
    let callback = function () {
        if (this.readyState == 4 && this.status == 200) {
            let records = JSON.parse(this.responseText);
            let html = "";
            for (record of records) {
                html += `<div id=record${record['id']} class="record">`;
                for (key in record) {
                    if (key != "file_path" && record[key] != undefined) {
                        html += `<p class="${key}">${key} - ${record[key]}</p>`;
                    }
                    else if (key == "file_path" && record[key] != undefined) {
                        html += 
                        `<picture class="image">
                            <source srcset="${record['file_path']}">
                            <img src="${record['file_path']}" alt="image${record['id']}/">
                        </picture>`;                
                    }
                }
                html += "</div>";
            }
            document.getElementById("records").innerHTML = html;
            document.getElementById("records").className = "feedback";
        }
    }
    sendAjaxRequest("GET", `/storage/database.db?table=feedback`, null, callback);
};

document.getElementById("game_button").onclick = function() {
    let callback = function () {
        if (this.readyState == 4 && this.status == 200) {
            let records = JSON.parse(this.responseText);
            let html = "";
            for (record of records) {
                html += `<div id=record${record['id']} class="record">`;
                html += `<p class="record_title">${record.id}  -  ${record.timestamp}</p>`;
                html += `<p class="record_body">${record.source}: ${record['record']}</p>`;
                html += "</div>";
            }
            document.getElementById("records").innerHTML = html;
            document.getElementById("records").className = "game_records";
        }
    }
    sendAjaxRequest("GET", `/storage/database.db?table=game_records`, null, callback);
}
