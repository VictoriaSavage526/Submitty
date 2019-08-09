function getNewDateTime(me){
    var releaseDate = document.getElementById("date_to_release");
    // pass filename to server to record the new date and time of the file to be released
    var newDateTime = $(me).val();
    //set the value to the new date and time
    releaseDate.value = newDateTime;
}

function determineRelease(nDT) {
    //get current date and time to determine what color the box is based
    //on time you want released and the current date
    var now = new Date();

    function pad(str){
        return ('0'+str).slice(-2);
    }

    var date = now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());

    var time = pad(now.getHours())+":"+pad(now.getMinutes())+":"+pad(now.getSeconds());
    var currentDT = date+' '+time;
    var neverDT = (now.getFullYear()+10)+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate())+' '+time;

    if (new Date(nDT).getTime() <= new Date(currentDT).getTime()) {
        return "#87db88";
    }
    else if(new Date(nDT).getTime()>=new Date(neverDT).getTime()){
        return "#f76c6c";
    }
    else {
        return "#ffeb54";
    }
}

function setChildPerm(dirArr,handleData){
    changeFolderPermission(dirArr,'1',function (output) {
        if(output){
            if(handleData){
                handleData(true);
            }
        }
    });
}

function setChild(dirArr,releaseDate,handleData) {
    //send the array of folder paths and set the time to the new one
    changeFolderNewDateTime(dirArr,releaseDate.value,function (output) {
        if(output){
            if(handleData){
                handleData(true);
            }
        }
    });
}

function confirmReleaseDate(){
    var directory = document.getElementById("submit-time");
    var dirArr = JSON.parse(directory.dataset.indir);
    var ID = directory.dataset.iden;

    var releaseDate = document.getElementById("date_to_release");
    //makes sure you cannot set to null times
    if(releaseDate.value == ""){
        window.alert("No blank time allowed");
        return;
    }
    setChildPerm(dirArr,function (output) {
        if(output){
            setChild(dirArr,releaseDate,function (output) {
                //when done reload
                if(output) {
                    var selectedDiv = 'date_to_release_'+ID;
                    //change value immediately and background color (will only appear after refresh bc you have to reload the stylesheet)
                    $("[id^="+selectedDiv+"]").val(releaseDate.value);
                    $("[id^='date_to_release_']").css("backgroundColor", 'determineRelease(releaseDate.value)').show();
                    //delay so function can finish most of the way
                    //window.setTimeout('parent.location.reload()',100);
                    parent.location.reload();
                }
            });
        }
    });
}

function changeFolderPermission(filenames, checked,handleData) {
    // send to server to handle file permission change
    let url = buildCourseUrl(['course_materials', 'modify_permission']) + '?filenames=' + encodeURIComponent(filenames[0]) + '&checked=' + checked;

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
    });
}