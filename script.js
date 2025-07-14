document.addEventListener('DOMContentLoaded', () => {
    
    // =================================================================
    //  1. ÉTAT DE L'APPLICATION ET GESTION LOCALE
    // =================================================================
    let state = {
        recipes: [],
        shoppingList: new Set(),
        activeFilter: 'all'
    };

    const defaultData = [
        {
            id: `r${Date.now()}`, title: "Crêpes Faciles", image: "https://images.unsplash.com/photo-1587339144369-03c95240a758?q=80&w=800", category: "dessert",
            prepTime: 10, cookTime: 20, servings: 4, difficulty: "Facile", isFavorite: true, rating: 5,
            ingredients: ["250g de farine", "4 oeufs", "50cl de lait", "1 pincée de sel"],
            instructions: ["Mélangez la farine et les oeufs.", "Ajoutez le lait progressivement.", "Laissez reposer 1 heure.", "Faites cuire dans une poêle chaude."]
        }
    ];

    function loadState() {
        state.recipes = JSON.parse(localStorage.getItem('gourmetBookRecipes')) || defaultData;
        const savedShoppingList = localStorage.getItem('gourmetBookShoppingList');
        state.shoppingList = new Set(savedShoppingList ? JSON.parse(savedShoppingList) : []);
    }

    function saveState() {
        localStorage.setItem('gourmetBookRecipes', JSON.stringify(state.recipes));
        localStorage.setItem('gourmetBookShoppingList', JSON.stringify(Array.from(state.shoppingList)));
    }

    // =================================================================
    //  2. SÉLECTEURS DU DOM
    // =================================================================
    const recipesGrid = document.getElementById('recipes-grid');
    const addRecipeBtn = document.getElementById('add-recipe-btn');
    const appModal = document.getElementById('app-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const searchInput = document.getElementById('search-input');
    const sidebarMenu = document.getElementById('sidebar-menu');
    const shoppingListBtn = document.getElementById('shopping-list-btn');
    const toast = document.getElementById('toast');
    const printArea = document.getElementById('print-area');
    const modalFooter = document.getElementById('modal-footer');

    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmOkBtn = document.getElementById('confirm-ok-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

    // =================================================================
    //  3. FONCTIONS DE RENDU
    // =================================================================
    function renderRecipes() {
        const searchTerm = searchInput.value.toLowerCase();
        const filter = state.activeFilter;

        const filteredRecipes = state.recipes.filter(recipe => {
            const matchesSearch = recipe.title.toLowerCase().includes(searchTerm);
            let matchesFilter = true;
            if (filter === 'favorites') {
                matchesFilter = recipe.isFavorite;
            } else if (filter !== 'all') {
                matchesFilter = recipe.category === filter;
            }
            return matchesSearch && matchesFilter;
        });

        recipesGrid.innerHTML = '';
        if (filteredRecipes.length === 0) {
            recipesGrid.innerHTML = '<p>Aucune recette trouvée.</p>';
            return;
        }

        filteredRecipes.forEach(recipe => {
            const recipeEl = document.createElement('div');
            recipeEl.className = 'recipe-card';
            recipeEl.dataset.id = recipe.id;
            const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
            recipeEl.innerHTML = `
                <div class="recipe-card-image-container">
                    <img src="${recipe.image || 'https://placehold.co/600x400/fbf3e7/c08a53?text=Recette'}" alt="${recipe.title}" class="recipe-card-image" onerror="this.src='https://placehold.co/600x400/fbf3e7/c08a53?text=Recette'">
                </div>
                <div class="recipe-card-content">
                    <h3>${recipe.title}</h3>
                    <div class="star-rating">${'★'.repeat(recipe.rating || 0)}${'☆'.repeat(5 - (recipe.rating || 0))}</div>
                    <div class="recipe-card-details" style="margin-top: 0.5rem;">
                        ${totalTime > 0 ? `<span><i class="fa-solid fa-clock"></i> ${totalTime} min</span>` : ''}
                        ${recipe.difficulty ? `<span><i class="fa-solid fa-gauge-high"></i> ${recipe.difficulty}</span>` : ''}
                    </div>
                </div>
            `;
            recipesGrid.appendChild(recipeEl);
        });
    }

    // =================================================================
    //  4. FONCTIONNALITÉS PRINCIPALES
    // =================================================================
    function openModal(mode, data = {}) {
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = '';
        modalFooter.innerHTML = '';

        if (mode === 'add' || mode === 'edit') {
            const recipe = mode === 'edit' ? state.recipes.find(r => r.id === data.id) : {};
            modalTitle.textContent = mode === 'edit' ? "Modifier la Recette" : "Ajouter une Recette";
            modalBody.innerHTML = `
                <form id="recipe-form">
                    <input type="hidden" id="recipe-id" value="${recipe.id || ''}">
                    <div class="form-group"><label for="recipe-title">Titre</label><input type="text" id="recipe-title" value="${recipe.title || ''}" required></div>
                    <div class="form-group"><label for="recipe-image">URL de l'image</label><input type="url" id="recipe-image" value="${recipe.image || ''}"></div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group"><label for="recipe-prep-time">Temps prép. (min)</label><input type="number" id="recipe-prep-time" value="${recipe.prepTime || ''}"></div>
                        <div class="form-group"><label for="recipe-cook-time">Temps cuisson (min)</label><input type="number" id="recipe-cook-time" value="${recipe.cookTime || ''}"></div>
                        <div class="form-group"><label for="recipe-servings">Personnes</label><input type="number" id="recipe-servings" value="${recipe.servings || ''}"></div>
                        <div class="form-group"><label for="recipe-difficulty">Difficulté</label><select id="recipe-difficulty"><option value="Facile" ${recipe.difficulty === 'Facile' ? 'selected' : ''}>Facile</option><option value="Moyen" ${recipe.difficulty === 'Moyen' ? 'selected' : ''}>Moyen</option><option value="Difficile" ${recipe.difficulty === 'Difficile' ? 'selected' : ''}>Difficile</option></select></div>
                    </div>
                    <div class="form-group"><label for="recipe-category">Catégorie</label><select id="recipe-category"><option value="entrée" ${recipe.category === 'entrée' ? 'selected' : ''}>Entrée</option><option value="plat" ${recipe.category === 'plat' ? 'selected' : ''}>Plat</option><option value="dessert" ${recipe.category === 'dessert' ? 'selected' : ''}>Dessert</option><option value="autre" ${recipe.category === 'autre' ? 'selected' : ''}>Autre</option></select></div>
                    <div class="form-group"><label for="recipe-ingredients">Ingrédients (un par ligne)</label><textarea id="recipe-ingredients" required>${recipe.ingredients ? recipe.ingredients.join('\n') : ''}</textarea></div>
                    <div class="form-group"><label for="recipe-instructions">Instructions (une étape par ligne)</label><textarea id="recipe-instructions" required>${recipe.instructions ? recipe.instructions.join('\n') : ''}</textarea></div>
                </form>
            `;
            modalFooter.innerHTML = `<button type="submit" form="recipe-form" class="btn">Sauvegarder</button>`;
        } else if (mode === 'view') {
            const recipe = state.recipes.find(r => r.id === data.id);
            modalTitle.textContent = recipe.title;
            modalBody.innerHTML = `
                <img src="${recipe.image || 'https://placehold.co/600x400/fbf3e7/c08a53?text=Recette'}" alt="${recipe.title}" style="width:100%; height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 2rem;">
                <h3>Ingrédients</h3>
                <ul>${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
                <h3 style="margin-top: 2rem;">Instructions</h3>
                <ol>${recipe.instructions.map(i => `<li>${i}</li>`).join('')}</ol>
            `;
            modalFooter.innerHTML = `
                <button class="btn btn-secondary" data-action="add-to-shopping-list" data-id="${data.id}"><i class="fa-solid fa-cart-plus"></i> Ajouter à la liste</button>
                <button class="btn btn-danger" data-action="delete" data-id="${data.id}"><i class="fa-solid fa-trash"></i></button>
                <button class="btn btn-secondary" data-action="print" data-id="${data.id}"><i class="fa-solid fa-file-pdf"></i> PDF</button>
                <button class="btn" data-action="edit" data-id="${data.id}"><i class="fa-solid fa-pen"></i> Modifier</button>
            `;
        } else if (mode === 'shopping-list') {
            modalTitle.textContent = "Liste de Courses";
            modalBody.innerHTML = '<ul id="shopping-list-ul"></ul>';
            renderShoppingList();
            modalFooter.innerHTML = `<button class="btn btn-danger" data-action="clear-shopping-list"><i class="fa-solid fa-broom"></i> Vider la liste</button>`;
        }
        appModal.style.display = 'flex';
    }

    function closeModal() { appModal.style.display = 'none'; }

    function handleFormSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('recipe-id').value;
        const recipeData = {
            title: document.getElementById('recipe-title').value, image: document.getElementById('recipe-image').value, category: document.getElementById('recipe-category').value,
            prepTime: parseInt(document.getElementById('recipe-prep-time').value) || 0, cookTime: parseInt(document.getElementById('recipe-cook-time').value) || 0,
            servings: parseInt(document.getElementById('recipe-servings').value) || 0, difficulty: document.getElementById('recipe-difficulty').value,
            ingredients: document.getElementById('recipe-ingredients').value.split('\n').filter(line => line.trim() !== ''),
            instructions: document.getElementById('recipe-instructions').value.split('\n').filter(line => line.trim() !== ''),
        };

        if (id) {
            const index = state.recipes.findIndex(r => r.id === id);
            state.recipes[index] = { ...state.recipes[index], ...recipeData };
            showToast("Recette modifiée !");
        } else {
            recipeData.id = `r${Date.now()}`;
            recipeData.isFavorite = false;
            recipeData.rating = 0;
            state.recipes.push(recipeData);
            showToast("Recette ajoutée !");
        }
        saveState();
        renderRecipes();
        closeModal();
    }

    function showToast(message) {
        toast.textContent = message;
        toast.className = 'show';
        setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
    }

    async function handlePrint(recipeId) {
        const recipe = state.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

        printArea.innerHTML = `
            <div class="print-header">
                <h1>${recipe.title}</h1>
                <div class="print-rating">${'★'.repeat(recipe.rating || 0)}${'☆'.repeat(5 - (recipe.rating || 0))}</div>
            </div>
            <img id="print-image" src="${recipe.image || 'https://placehold.co/600x400/fbf3e7/c08a53?text=Recette'}" alt="${recipe.title}">
            <div class="print-details">
                ${totalTime > 0 ? `<span><i class="fa-solid fa-clock"></i> ${totalTime} min</span>` : ''}
                ${recipe.servings ? `<span><i class="fa-solid fa-users"></i> ${recipe.servings} pers.</span>` : ''}
                ${recipe.difficulty ? `<span><i class="fa-solid fa-gauge-high"></i> ${recipe.difficulty}</span>` : ''}
            </div>
            <div class="print-body">
                <div class="print-ingredients">
                    <h3>Ingrédients</h3>
                    <ul>${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
                </div>
                <div class="print-instructions">
                    <h3>Instructions</h3>
                    <ol>${recipe.instructions.map(i => `<li>${i}</li>`).join('')}</ol>
                </div>
            </div>
            <div class="print-footer">Gourmet-Book</div>
        `;
        
        const img = printArea.querySelector('#print-image');
        await new Promise((resolve) => {
            if (!img.src || img.src.includes('placehold.co')) return resolve();
            if (img.complete) return resolve();
            img.onload = resolve;
            img.onerror = () => {
                img.src = 'https://placehold.co/600x400/fbf3e7/c08a53?text=Image+Indisponible';
                resolve();
            };
        });

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const canvas = await html2canvas(printArea, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`recette-${recipe.title.replace(/\s/g, '_')}.pdf`);
        showToast("Le PDF a été généré !");
    }

    function renderShoppingList() {
        const ul = document.getElementById('shopping-list-ul');
        if (!ul) return;
        ul.innerHTML = '';
        if (state.shoppingList.size === 0) {
            ul.innerHTML = '<li>Votre liste de courses est vide.</li>';
            return;
        }
        state.shoppingList.forEach((ingredient) => {
            const li = document.createElement('li');
            li.textContent = ingredient;
            ul.appendChild(li);
        });
    }
    
    function handleAddToShoppingList(recipeId) {
        const recipe = state.recipes.find(r => r.id === recipeId);
        if (recipe && recipe.ingredients) {
            recipe.ingredients.forEach(ingredient => {
                state.shoppingList.add(ingredient);
            });
            saveState();
            showToast("Ingrédients ajoutés à la liste !");
        }
    }
    
    function showConfirmation(message, onConfirm) {
        confirmationMessage.textContent = message;
        confirmationModal.style.display = 'flex';

        const okHandler = () => {
            onConfirm();
            confirmationModal.style.display = 'none';
        };

        const cancelHandler = () => {
            confirmationModal.style.display = 'none';
        };
        
        confirmOkBtn.addEventListener('click', okHandler, { once: true });
        confirmCancelBtn.addEventListener('click', cancelHandler, { once: true });
    }

    // =================================================================
    //  5. GESTIONNAIRES D'ÉVÉNEMENTS
    // =================================================================
    
    addRecipeBtn.addEventListener('click', () => openModal('add'));
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === appModal || e.target === confirmationModal) { closeModal(); confirmationModal.style.display = 'none'; } });
    
    document.body.addEventListener('submit', (e) => { if (e.target.id === 'recipe-form') handleFormSubmit(e); });

    searchInput.addEventListener('input', renderRecipes);
    sidebarMenu.addEventListener('click', (e) => {
        const target = e.target.closest('.sidebar-menu-item');
        if (target) {
            document.querySelector('.sidebar-menu-item.active').classList.remove('active');
            target.classList.add('active');
            state.activeFilter = target.dataset.filter;
            renderRecipes();
        }
    });

    recipesGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.recipe-card');
        if (card) openModal('view', { id: card.dataset.id });
    });
    
    modalFooter.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const action = target.dataset.action;
        const id = target.dataset.id;
        if (action === 'edit') openModal('edit', { id });
        if (action === 'delete') {
            showConfirmation("Supprimer cette recette ?", () => {
                state.recipes = state.recipes.filter(r => r.id !== id);
                saveState();
                renderRecipes();
                closeModal();
                showToast("Recette supprimée.");
            });
        }
        if (action === 'print') handlePrint(id);
        if (action === 'add-to-shopping-list') handleAddToShoppingList(id);
        if (action === 'clear-shopping-list') {
            showConfirmation("Vider la liste de courses ?", () => {
                state.shoppingList.clear();
                saveState();
                renderShoppingList();
            });
        }
    });
    
    shoppingListBtn.addEventListener('click', () => openModal('shopping-list'));

    // =================================================================
    //  6. INITIALISATION
    // =================================================================
    loadState();
    renderRecipes();
});
</script>
</body>
</html>