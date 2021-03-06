/**
 * Created by Dylan on 10/02/2015.
 */

//Liste des projets par requête Ajax dans un div (id) et en fonction du pseudo de l'utilisateur (username)
function getListProjects(id, username) {
    var url = config.apiPath + 'php/projectManagement.php?action=list';

    var xhr = createCORSRequest('POST', url);

    if (!xhr) {
        noty({layout: 'topRight', type: 'error', text: 'Erreur, navigateur incompatible avec les requêtes CORS.', timeout: '5000'});
        return;
    }

    xhr.onload = function() {
        console.log('response : ' + xhr.responseText);

        var tabListProjects = JSON.parse(xhr.responseText);

        console.log(tabListProjects.length);

        if(tabListProjects.length > 0)
        {
            eId(id).innerHTML = '';

            for(var i = 0; i < tabListProjects.length; i++)
            {
                eId(id).innerHTML += '<div class="list-group-item" ><a href="#" onclick="loadProject(\'' + tabListProjects[i] + '\')" data-dismiss="modal">' + tabListProjects[i] + '</a>' + ((tabListProjects[i].replace('.vejs', '') != currentProject.name) ? '<button class="btn btn-danger btn-xs pull-right" onclick="deleteProject(\'' + tabListProjects[i].replace('.vejs', '') + '\');"><span class="glyphicon glyphicon-remove"></span></button>' : '') + '</div>';
            }
        }
        else
        {
            eId(id).innerHTML = 'Aucun projet.';
        }
    };

    xhr.onerror = function() {
        reportError('No contact with server');

        noty({layout: 'topRight', type: 'error', text: 'Erreur, impossible de contacter le serveur.', timeout: '5000'});
    };

    xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xhr.send('username=' + username);
}

//Création d'un nouveau projet
function newProject(buttonBack) {
    eId('nameProject').value = '';
    eId('buttonBackAddProject').style.display = (buttonBack) ? 'initial' : 'none';

    $('#selectProjectModal').modal('hide');
    $('#alreadyExistProjectModal').modal('hide');
    $('#newProjectModal').modal('show');
}

//Sauvegarde du nouveau project
function saveNewProject(nameProject) {
    if(nameProject != '')
    {
        $('#newProjectModal').modal('hide');

        resetInterface();

        //Objet du projet avec l'ensemble des paramètres
        currentProject = new Project(nameProject.deleteAccent().replace(new RegExp(' ', 'g'), '_').toUpperCase(), uId(), usernameSession, getCurrentDate());
        currentProject.updateText();
        currentProject.switchAutoSave();
        currentProject.isReady = true;

        saveProject();
    }
    else
    {
        noty({layout: 'topRight', type: 'error', text: 'Vous devez renseigner le nom du projet.', timeout: '5000'});
    }
}

function openProject() {
    getListProjects('listProjects');

    $('#selectProjectModal').modal('show');
}

//Chargement du projet
function loadProject(fileName) {
    sLoadM();

    var url = config.apiPath + 'php/projectManagement.php?action=read';

    var xhr = createCORSRequest('POST', url);

    if (!xhr) {
        noty({layout: 'topRight', type: 'error', text: 'Erreur, navigateur incompatible avec les requêtes CORS.', timeout: '5000'});
        return;
    }

    xhr.onload = function() {
        console.log('response : ' + xhr.responseText);
        var jsonRep = JSON.parse(xhr.responseText);

        if (jsonRep.code != -1)
        {
            //Classe ReadFileProject qui permet d'ouvrir un projet
            readFileProject = new ReadFileProject(xhr.responseText);
            readFileProject.loadProject();
        }
        else
        {
            hLoadM();

            $('#startLoadingEditor').modal('show');

            noty({layout: 'topRight', type: 'error', text: 'Erreur, impossible de charger ce project.', timeout: '5000'});
        }
    };

    xhr.onerror = function() {
        reportError('No contact with server');

        noty({layout: 'topRight', type: 'error', text: 'Erreur, impossible de contacter le serveur.', timeout: '5000'});
    };

    xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xhr.send('nameProject=' + fileName);
}

//Sauvegarde du projet : GenerateFileProject permet de créer le fichier JSON avec tout le contenu du projet puis envoi par requête Ajax.
function saveProject() {
    if(currentProject) {
        rLog('Saving project ...');

        listAvailableRenderFiles();
        sLoadM();

        var fileProject = new GenerateFileProject(currentProject.name, currentProject.uId, currentProject.dateCreation, currentProject.lastSave, currentProject.tabListFiles, currentProject.tabListTracks);
        var contentFile = fileProject.generateMain();

        console.log(contentFile);

        var url = config.apiPath + 'php/projectManagement.php?action=save';

        var xhr = createCORSRequest('POST', url);

        if (!xhr) {
            noty({layout: 'topRight', type: 'error', text: 'Erreur, navigateur incompatible avec les requêtes CORS.', timeout: '5000'});
            return;
        }

        xhr.onload = function() {
            console.log('response : ' + xhr.responseText);

            var jsonRep = JSON.parse(xhr.responseText);

            hLoadM();

            if(jsonRep.code == 0)
            {
                currentProject.lastSave = getHour();
                currentProject.forceSave = true;

                currentProject.updateText();

                noty({layout: 'topRight', type: 'success', text: 'Project sauvegardé.', timeout: '5000'});

                rLog('Saved!');
            }
            else if(jsonRep.code == 1) // already exist
            {
                $('#alreadyExistProjectModal').modal('show');
            }
            else
            {
                noty({layout: 'topRight', type: 'error', text: 'Nous n\'arrivons pas à sauvegarder le projet.', timeout: '5000'});
            }
        };

        xhr.onerror = function() {
            reportError('No contact with server');

            noty({layout: 'topRight', type: 'error', text: 'Erreur, impossible de contacter le serveur.', timeout: '5000'});
        };

        xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        xhr.send('nameProject=' + currentProject.name + '&contentFile=' + JSON.stringify(contentFile) + '&forceSave=' + currentProject.forceSave);
    }
}

function deleteProject(projectName) {
    if(projectName == undefined)
        return;

    rLog('-PROJECT- delete : start [name: ' + projectName + ']');

    var url = config.apiPath + 'php/projectManagement.php?action=delete';

    var xhr = createCORSRequest('POST', url);

    if (!xhr) {
        noty({layout: 'topRight', type: 'error', text: 'Erreur, navigateur incompatible avec les requêtes CORS.', timeout: '5000'});
        return;
    }

    xhr.onload = function() {
        console.log('response : ' + xhr.responseText);

        var jsonRep = JSON.parse(xhr.responseText);

        if(jsonRep.code == 0)
        {
            rLog('-PROJECT- delete : end|true [name: ' + projectName + ']');

            getListProjects('listExistingProjects');
            getListProjects('listProjects');

            noty({layout: 'topRight', type: 'success', text: 'Le projet ' + projectName + ' a bien été supprimé.', timeout: '5000'});
        }
        else
        {
            rLog('-PROJECT- delete : end|false [name: ' + projectName + ']');

            noty({layout: 'topRight', type: 'error', text: 'Nous n\'arrivons pas à supprimer le projet.', timeout: '5000'});
        }
    };

    xhr.onerror = function() {
        reportError('No contact with server');

        noty({layout: 'topRight', type: 'error', text: 'Erreur, impossible de contacter le serveur.', timeout: '5000'});
    };

    xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xhr.send('nameProject=' + projectName);
}

function resetInterface() {
    eId('videoInfo').innerHTML = '';
    eId('videoView').innerHTML = '';

    eId('audioInfo').innerHTML = '';
    eId('audioView').innerHTML = '';

    eId('listFiles').innerHTML = '<span>Aucun fichier.</span><span class="textNote">Glissez des fichiers ou cliquez sur ajouter.</span>';

    eId('iconAutoSave').classList.remove('glyphicon-check');
    eId('iconAutoSave').classList.add('glyphicon-unchecked');

    oneSecond = 5;
    eId('zoomRange').value = 5;
    calculateTimeBar();
}

//Fonction d'auto-sauvegarde du projet (possibilité de désactivation)
function autoSaveInterval() {
    saveProject();
}

//Lorsque le projet existe déjà, proposition de l'écraser ou alors d'en créer un avec un autre nom
function overwriteProject() {
    $('#alreadyExistProjectModal').modal('hide');

    sLoadM();

    var url = config.apiPath + 'php/projectManagement.php?action=create';
    var xhr = createCORSRequest('POST', url);

    if (!xhr) {
        noty({layout: 'topRight', type: 'error', text: 'Erreur, navigateur incompatible avec les requêtes CORS.', timeout: '5000'});
        return;
    }

    xhr.onload = function() {
        console.log('response : ' + xhr.responseText);
        var jsonRep = JSON.parse(xhr.responseText);

        hLoadM();

        if(jsonRep.code == 0)
        {
            //forceSave permet de préciser si on écrase le projet automatiquement à chaque enregistrement
            currentProject.forceSave = true;
            saveProject();
        }
        else
        {
            noty({layout: 'topRight', type: 'error', text: 'Nous n\'arrivons pas à sauvegarder le projet.', timeout: '5000'});
        }
    };

    xhr.onerror = function() {
        reportError('No contact with server');

        noty({layout: 'topRight', type: 'error', text: 'Erreur, impossible de contacter le serveur.', timeout: '5000'});
    };

    xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xhr.send('nameProject=' + currentProject.name);
}