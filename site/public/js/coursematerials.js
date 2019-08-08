window.onload = function () {
    //determine if folders have been left open or closed
    var folderCookie = getCookie('foldersOpen');
    //if the cookie says it is open
    if(folderCookie == "open"){
        //open all the folders
        openAllDivForCourseMaterials();
        getFiles().forEach(function(file) {
            //if one of the subdirs, check if it is closed post opening all
            var subFolderCookie = getCookie("{{ file }}".substr(0,'{{ file }}'.lastIndexOf("/")));
            if(subFolderCookie.indexOf("closed")==0){
                //if closed. close it after it has been opened by the override above
                closeDivForCourseMaterials(subFolderCookie.substr(6,subFolderCookie.length));
            }
        });
    } else {
        //makes sure that opened folders don't get opened multiple times
        let trackOpens = new Map();
        //goes through all possible directories
        getFiles().forEach(function(file) {
            //get the cookie for each dir
            var subFolderCookie = getCookie("{{ file }}".substr(0,'{{ file }}'.lastIndexOf("/")));
            //if the folder is open
            if(subFolderCookie.indexOf("open")==0){
                //check if the folder has been opened already (do it it again will close it)
                if(trackOpens.get(subFolderCookie.substr(4,subFolderCookie.length)) === undefined){
                    //undefined means it has not been opened
                    //set the value as open so it will not be reopened
                    trackOpens.set(subFolderCookie.substr(4,subFolderCookie.length),"released");
                    //open the folder
                    openDivForCourseMaterials(subFolderCookie.substr(4,subFolderCookie.length));
                }
            } else {
                if(subFolderCookie.indexOf("closed")==0){
                    //if the folder should be closed, close it
                    closeDivForCourseMaterials(subFolderCookie.substr(6,subFolderCookie.length));
                    //there's no way to open it in that function
                }
            }
        });
    }
    // loop thru each div_viewer_xxx
    var jumpToScrollPosition = document.cookie.replace(/(?:(?:^|.*;\s*)jumpToScrollPosition\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    if (jumpToScrollPosition.length > 0 && jumpToScrollPosition != '-1') {
        $('[id^=div_viewer_]').each(function() {
        var number = this.id.replace('div_viewer_', '').trim();
        var keyValuePairs = document.cookie.split(';');

        for(var i = 0; i < keyValuePairs.length; i++) {
            var name = keyValuePairs[i].substring(0, keyValuePairs[i].indexOf('=')).trim();
            var value = keyValuePairs[i].substring(keyValuePairs[i].indexOf('=')+1);
            if (name === 'cm_'+number && value === '1') {
                openDivForCourseMaterials(number);
                document.cookie = 'cm_' + number + '='; // clean up cookie since we don't need this anymore
            }
        }
    });
        // jump to last location if scroll is enabled.
        window.scrollTo(0, jumpToScrollPosition);
        document.cookie = 'jumpToScrollPosition=-1';

    } else {
        // clean up all cookies which are stated with "cm_";
        $('[id^=div_viewer_]').each(function() {
            var number = this.id.replace('div_viewer_', '').trim();
            var keyValuePairs = document.cookie.split(';');

            for(var i = 0; i < keyValuePairs.length; i++) {
                var name = keyValuePairs[i].substring(0, keyValuePairs[i].indexOf('=')).trim();
                if (name === 'cm_'+number) {
                    document.cookie = 'cm_' + number + '=';
                }
            }
        });
    }
};

$(document).ready(function() {
    flatpickr(".date-picker", {
        plugins: [ShortcutButtonsPlugin(
                {
                    button: [
                        {
                            label: "Now"
                        },
                        {
                            label: "Tomorrow"
                        },
                        {
                            label: "End of time"
                        }

                    ],
                    onClick: (index, fp) => {
                        let date;
                        switch (index) {
                            case 0: 
                                updateToServerTime(fp);
                                break;
                            case 1:
                                updateToTomorrowServerTime(fp);
                                break;
                            case 2:
                                date = new Date("9998-01-01 00:00:00");
                                fp.setDate(date,true);
                                break;

                        }
                    }
                }
            )],
        allowInput: true,
        enableTime: true,
        enableSeconds: true,
        time_24hr: true,
        dateFormat: "Y-m-d H:i:S",
        onOpen: handleTimeZones()
    });
});

//this needs to be here so the boxes can be colored on load (will say it is not declared)
function determineRelease(inputID){
    var now = server_time;

    function pad(str){
        return ('0'+str).slice(-2);
    }

    var date = now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());

    var time = pad(now.getHours())+":"+pad(now.getMinutes())+":"+pad(now.getSeconds());
    var currentDT = date+' '+time;
    var neverDT = (now.getFullYear()+10)+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate())+' '+time;

    //get the value in each file so the color can be assigned
    //based on the time chosen
    var inputDT = document.getElementById(inputID);
    var fileDT = inputDT.value;
    //also custom colors for this page for readability
    if(new Date(fileDT).getTime()<=new Date(currentDT).getTime()) {
        return getComputedStyle(document.documentElement).getPropertyValue('--date-picker-green');
    }
    else if(new Date(fileDT).getTime()>=new Date(neverDT).getTime()) {
        return getComputedStyle(document.documentElement).getPropertyValue('--date-picker-red');
    }
    else {
        return getComputedStyle(document.documentElement).getPropertyValue('--date-picker-yellow');
    }
}

//set cookie for open adapted from w3schools
function setCookie(cName,cVal){
    document.cookie = cName+'='+cVal;
}
//get the value for the cookie with this name
function getCookie(cName) {
    var name = cName+'=';
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function shareToOther(id, path) {
    // pass filename to server to record the permission of the file
    var idName = "#share_checkbox_" + id;
    if($(idName).is(':checked')) {
        changePermission(path, '1');
    }
    else {
        changePermission(path, '0');
    }
}

function setNewDateTime(me, path) {
    // pass filename to server to record the new date and time of the file to be released
    var newDateTime = $(me).val();
    changeNewDateTime(path, newDateTime);

    var url = buildUrl(['server_time']);

    $.get({
        url: url,
        success: function(data) {
            determineRelease(me)
        },
        error: function(e) {
            console.log("Error getting server time.");
        }
    });
}

function setChildNewDateTime(path, changeDate,handleData) {
    //change the date and time of the subfiles in the folder with the time chosen for the whole
    //folder (passed in)
    var success;
    success = false;
    success = changeFolderNewDateTime(path,changeDate,function (output) {
        if(output){
            success =true;
            if(handleData){
                handleData(success);
            }
        }
    });
}

function handleTimeZones() {
    var url = buildUrl(['server_time']);

    $.get({
        url: url,
        success: function(data) {

            // Collect server time
            var server_time = JSON.parse(data)['data'];
            server_time = new Date(parseInt(server_time.year),
                parseInt(server_time.month) - 1,
                parseInt(server_time.day),
                parseInt(server_time.hour),
                parseInt(server_time.minute),
                parseInt(server_time.second));

            // Collect client time
            var client_time = new Date();

            // Calculate difference in minutes
            var diff_in_minutes = Math.abs(server_time.valueOf() - client_time.valueOf());
            diff_in_minutes = diff_in_minutes / 1000 / 60;

            // If difference in minutes is greater than 10 minutes then append message to flatpickr
            if(diff_in_minutes > 10) {
                $('.flatpickr-calendar').append('<p>Enter all times relative to the server timezone</p>');
                $('.flatpickr-calendar').append('<p>Server timezone: {{ core.getConfig().getTimezone().getName() }}</p>');
            }
        },
        error: function(e) {
            console.log("Error getting server time.");
        }
    });
}

function newDeleteCourseMaterialForm(path, file_name) {
    let url = buildCourseUrl(["course_materials", "delete"]) + "?path=" + path;
    var current_y_offset = window.pageYOffset;
    document.cookie = 'jumpToScrollPostion='+current_y_offset;

    $('[id^=div_viewer_]').each(function() {
        var number = this.id.replace('div_viewer_', '').trim();

        var elem = $('#div_viewer_' + number);
        if (elem.hasClass('open')) {
            document.cookie = "cm_" +number+ "=1;";
        }
        else {
            document.cookie = "cm_" +number+ "=0;";
        }
    });

    $('.popup-form').css('display', 'none');
    var form = $("#delete-course-material-form");
    $('[name="delete-course-material-message"]', form).html('');
    $('[name="delete-course-material-message"]', form).append('<b>'+file_name+'</b>');
    $('[name="delete-confirmation"]', form).attr('action', url);
    form.css("display", "block");
}

function openDivForCourseMaterials(num) {
    var elem = $('#div_viewer_' + num);
    if (elem.hasClass('open')) {
        elem.hide();
        elem.removeClass('open');
        $($($(elem.parent().children()[0]).children()[0]).children()[0]).removeClass('fa-folder-open').addClass('fa-folder');
        return 'closed';
    } else {
        elem.show();
        elem.addClass('open');
        $($($(elem.parent().children()[0]).children()[0]).children()[0]).removeClass('fa-folder').addClass('fa-folder-open');
        return 'open';
    }
}

function openAllDivForCourseMaterials() {
    var elem = $("[id ^= 'div_viewer_']");
    if (elem.hasClass('open')) {
        elem.hide();
        elem.removeClass('open');
        $($($(elem.parent().children()[0]).children()[0]).children()[0]).removeClass('fa-folder-open').addClass('fa-folder');
        return 'closed';
    } else {
        elem.show();
        elem.addClass('open');
        $($($(elem.parent().children()[0]).children()[0]).children()[0]).removeClass('fa-folder').addClass('fa-folder-open');
        return 'open';
    }
}

function closeDivForCourseMaterials(num) {
    var elem = $('#div_viewer_' + num);
    elem.hide();
    elem.removeClass('open');
    $($($(elem.parent().children()[0]).children()[0]).children()[0]).removeClass('fa-folder-open').addClass('fa-folder');
    return 'closed';
}

function openAllDivForCourseMaterials() {
    var elem = $("[id ^= 'div_viewer_']");
    if (elem.hasClass('open')) {
        elem.hide();
        elem.removeClass('open');
        $($($(elem.parent().children()[0]).children()[0]).children()[0]).removeClass('fa-folder-open').addClass('fa-folder');
        return 'closed';
    } else {
        elem.show();
        elem.addClass('open');
        $($($(elem.parent().children()[0]).children()[0]).children()[0]).removeClass('fa-folder').addClass('fa-folder-open');
        return 'open';
    }
}

function newUploadCourseMaterialsForm() {

    createArray(1);

    var fileList = document.getElementsByClassName("file-viewer-data");

    var files = [];
    for(var i=0;i<fileList.length;i++){
        var file = fileList[i];
        files.push(file.getAttribute('data-file_url'));
        readPrevious(file.getAttribute('data-file_url'), 1);
    }

    $('.popup-form').css('display', 'none');
    var form = $("#upload-course-materials-form");

    $('[name="existing-file-list"]', form).html('');
    $('[name="existing-file-list"]', form).append('<b>'+JSON.stringify(files)+'</b>');

    form.css("display", "block");
    $('[name="upload"]', form).val(null);

}

function setFolderRelease(changeActionVariable,releaseDates,id,inDir){

    $('.popup-form').css('display', 'none');

    var form = $("#set-folder-release-form");

    form.css("display", "block");

    $('[id="release_title"]',form).attr('data-path',changeActionVariable);
    $('[name="release_date"]', form).val(releaseDates);
    $('[name="release_date"]',form).attr('data-fp',changeActionVariable);

    inDir = JSON.stringify(inDir);
    $('[name="submit"]',form).attr('data-iden',id);
    $('[name="submit"]',form).attr('data-inDir',inDir);

}

function downloadCourseMaterialZip(dir_name, path) {
    window.location = buildNewCourseUrl(['course_materials', 'download_zip']) + '?dir_name=' + dir_name + '&path=' + path;
}

function changePermission(filename, checked) {
    // send to server to handle file permission change
    let url = buildNewCourseUrl(['course_materials', 'modify_permission']) + '?filenames=' + encodeURIComponent(filename) + '&checked=' + checked;

    $.ajax({
        type: "POST",
        url: url,
        data: {'fn':filename,csrf_token: csrfToken},
        success: function(data) {},
        error: function(e) {
            alert("Encounter saving the checkbox state.");
        }
    })
}

function changeFolderPermission(filenames, checked,handleData) {
    // send to server to handle file permission change
    let url = buildNewCourseUrl(['course_materials', 'modify_permission']) + '?filenames=' + encodeURIComponent(filenames[0]) + '&checked=' + checked;

    $.ajax({
        type: "POST",
        url: url,
        data: {'fn':filenames,csrf_token: csrfToken},
        success: function(data) {
            if(handleData){
                handleData(data);
            }
        },
        error: function(e) {
            alert("Encounter saving the checkbox state.");
        }
    })
}

function showDateInput(id) {
    $("#date_to_release_" + id).show();
}