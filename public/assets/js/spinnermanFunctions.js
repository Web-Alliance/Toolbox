export { runSpinnerman, spinData, cleanSpin, get_existing_traduction_files, clean_data, end_process };

/**
 * fait l'appel en asynchrone de l'api de spin
 * @param {object} data
 * @param {object} options
 * @returns
 */
async function spinData(data, options, messagecontainer) {
  let ret = []; //tableau de résultat final
  let i = 1; //un compteur pour le visuel utilisateur

  for (const value of Object.keys(data)) {
    //on indique à l'utilisateur combien d'éléments ont été spinnés avec la valeur du compteur / la longueur de l'objet à spinner
    messagecontainer.innerHTML = `<span class="font-weight-bold m-3">Spin en cours ... ${i}/${
      Object.keys(data).length
    }</span>`;

    //on utilise le destructuring pour associer les variables à leur équivalent dans l'objet
    const { h1, title, url, contenu } = data[value];

    const spinnedData = await fetch("/spinned", {
      ...options,
      body: JSON.stringify({ h1, title, url, contenu }),
    })
      .then((res) => res.json())
      .catch((err) => {
        console.log("spin error : " + err);
        let messageContainer = document.querySelector('.messages');
        messageContainer.textContent = "Une erreur s'est produit lors de l'échange avec l'API de Spin. Vérifiez la disponibilité du service ou votre clef API."

      });

    ret.push(spinnedData);
    i++; // on incrémente le compteur
  }
  return ret;
}

/**
 * formate le masterspin reçu de l'API et renvoie une chaine de caractère valide
 * @param {string} text
 * @returns
 */
function cleanSpin(text) {
  let arrayText = text.split("|"); //on split le texte en 1 tableau d'éléments séparé aux endroits de la string ou "|" apparait
  let newText = []; // on créée le tableau qui contiendra le texte final nettoyé

  for (let element of arrayText) {
    //on itère sur le tableau pour retirer les chevrons "{" et "}"
    let elementWithoutEndTag = element.replace("}", "");
    let index = elementWithoutEndTag.indexOf("{");

    // si le chevron "{" n'est pas dans la string alors on envoie directement la string dans le tableau final sinon on retire le chevron grâce à son index avant de l'integrer au tableau
    if (index != -1) {
      let result = elementWithoutEndTag.slice(0, index);
      newText.push(result);
    } else {
      newText.push(elementWithoutEndTag);
    }
  }
  // on retourne le tableau sous forme de string assemblée avec un espace entre les éléments
  return newText.join("");
}

/**
 * récupère les fichiers de traductions liés au blog existant
 */
async function get_existing_traduction_files(nomBlog, options) {
  let existingFiles = document.getElementById("existingFiles");
  try {
    let response = await fetch("/get_existing_files/" + nomBlog, {
      ...options,
    });

      let data = await response.json();
      let selectOptions =
      "<option>Selectionner le fichier de traduction</option>";
      
      for (const [key, value] of Object.entries(data)) {
        selectOptions += `<option value="${value[0]}" data-txt="${value[1]}">${key}</option>`;
      }
      existingFiles.innerHTML = selectOptions;
  
  } catch (error) {
    console.log(error);
  }
}

/**
 * organise la data en un tableau exploitable
 * @param {*} res
 * @returns
 */
function clean_data(res) {
  let clean_spinned_array = []; //tableau qui va recevoir la data "nettoyée" et prête à l'emploi

  for (const value of Object.keys(res)) {
    const result = res[value];
    let temp = {}; //variable temporaire qui va recevoir les données pour une ligne
    temp["h1"] = cleanSpin(result.h1);
    temp["title"] = cleanSpin(result.title);
    temp["url"] = cleanSpin(result.url);
    temp["contenu"] = cleanSpin(result.contenu);

    clean_spinned_array.push(temp);
  }
  return clean_spinned_array;
}

/**
 * Construit le fichier d'export csv et affiche les derniers messages de succès ou d'erreurs
 * @param {*} makeCsvFileProgressTag
 * @param {*} spiderContainer
 * @param {*} clean_spinned_array
 */
async function end_process(makeCsvFileProgressTag, spiderContainer, clean_spinned_array, nomBlog, options, txtFile = null) {
  //on fetch l'url qui créée le fichier csv final avec le contenu du tableau nettoyé (clean_spin_array)
  try {
    let response = await fetch("/make_csv_file/" + nomBlog.value, {
      ...options,
      body: JSON.stringify(clean_spinned_array),
    });
      let data = await response.json();
      makeCsvFileProgressTag.innerHTML = `<span class="font-weight-bold alert text-success m-3"><i class="fa-solid fa-check"></i> Création du fichier d'export csv réussi</span>`;
      spiderContainer.classList.remove("web"); // on retire la class qui fait apparaitre l'animation de l'araignée
      spiderContainer.classList.add("congrats"); // on ajoute la class congrats pour utiliser ses règles css
      //on fait apparaitre les bouttons de téléchargement
      if (txtFile) {
        spiderContainer.innerHTML = `<div class="resultApi">Spinnerman a terminé vos spins ! Téléchargez les : <button class=" btn btn-lg btn-primary mt-3 allWaButton"><a class="text-white" href="/assets/uploads/spins/${data}.csv">lot beem anglais</a></butyon> <button class=" btn btn-lg btn-primary mt-3 allWaButton"><a class="text-white" href="/assets/uploads/listes/${txtFile}" download target="_blank">La liste de vos titres traduits</a></butyon> </div> <img class="congrats" src="/assets/img/spinnerman/araignee_souriante.png">`;
      } else {
        spiderContainer.innerHTML = `<div class="resultApi">Spinnerman a terminé vos spins ! Téléchargez les : <button class=" btn btn-lg btn-primary mt-3 allWaButton"><a class="text-white" href="/assets/uploads/spins/${data}.csv">lot beem anglais</a></butyon> <button class=" btn btn-lg btn-primary mt-3 allWaButton"><a class="text-white" href="/assets/uploads/listes/${data}.txt" download target="_blank">La liste de vos titres traduits</a></butyon> </div> <img class="congrats" src="/assets/img/spinnerman/araignee_souriante.png">`;
      }
  } catch (error) {
    console.log(error);
  }
}

/**
 * 
 * @param {HTMLBodyElement} spiderContainer le contenainer des animations de l'araignée et des resultats de fin de traitement
 * @param {HTMLBodyElement} translateProgress le container d'état de progression de la traduction
 * @param {HTMLBodyElement} spinProgress le container d'état de progression du spin
 * @param {HTMLBodyElement} makeFileProgress le container d'état de progression de création du fichier de sortie
 * @param {HTMLBodyElement} nomBlog input text du nom du blog
 * @param {object} options objet option qui nous servira de base pour les appels fetch
 */
async function runSpinnerman(spiderContainer, translateProgress, spinProgress, makeFileProgress, nomBlog, options) {
  //On ajoute la class web au spidercontainer pour que les règles css fassent apparaitre l'animation de l'araignée
  spiderContainer.classList.add("web");
  translateProgress.innerHTML = `<span class="font-weight-bold m-3">Traduction en cours ...</span>`;

  try {
    let response = await fetch("/translate/" + nomBlog.value, {
      ...options,
      body: JSON.stringify(xml),
    });
      let data = await response.json();
      translateProgress.innerHTML = `<span class="font-weight-bold alert text-success m-3"><i class="fa-solid fa-check"></i> Traduction Terminée</span>`;
      spinProgress.innerHTML = `<span class="font-weight-bold m-3">Spin en cours ...</span>`;
      
        let spin = await spinData(data, options, spinProgress);
        let clean_spinned_array = clean_data(spin);
        spinProgress.innerHTML = `<span class="font-weight-bold alert text-success m-3"><i class="fa-solid fa-check"></i> Spin Terminé</span>`;
        makeFileProgress.innerHTML = `<span class="font-weight-bold m-3">Création du fichier d'export csv ...</span>`;
        await end_process(
          makeFileProgress,
          spiderContainer,
          clean_spinned_array,
          nomBlog,
          options
        );
  } catch (err) {
    console.log(err);
    let messageContainer = document.querySelector('.messages');
    messageContainer.textContent = "Une erreur s'est produit lors de l'échange avec l'API de traduction. Vérifiez la disponibilité du service ou votre clef API."

  }
}
