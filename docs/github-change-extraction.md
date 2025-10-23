# Extraire toutes les modifications GitHub sur une branche

Cette note explique comment récupérer l'ensemble des changements associés à plusieurs tâches réalisées sur la même branche.

## Via l'interface GitHub

1. Poussez votre branche de travail vers GitHub : `git push origin <nom-de-branche>`.
2. Dans GitHub, cliquez sur **Compare & pull request** ou ouvrez directement l'URL `https://github.com/<organisation>/<repo>/compare/main...<nom-de-branche>`.
3. Dans l'écran de comparaison, vous pouvez :
   - Consulter l'intégralité du diff (fichiers modifiés, commentaires, etc.).
   - Utiliser le menu **...** ▶ **View file** ou **View file @ commit** pour télécharger un fichier isolé.
   - Choisir **Download patch** pour récupérer un fichier `.patch` contenant tous les changements de la branche.
4. Si vous avez besoin d'archiver les fichiers complets (et pas seulement le diff), ouvrez l'onglet **Files changed** du Pull Request, puis sélectionnez **Code** ▶ **Download ZIP** pour récupérer l'état complet de la branche.

## Via la ligne de commande

1. Assurez-vous d'être à jour :
   ```bash
   git fetch origin
   ```
2. Placez-vous sur la branche cible :
   ```bash
   git checkout <nom-de-branche>
   ```
3. Pour générer un diff de tous les commits de la branche par rapport à `main` :
   ```bash
   git diff origin/main...HEAD > modifications.patch
   ```
   Le fichier `modifications.patch` contiendra la somme de toutes les modifications.
4. Si vous voulez obtenir un patch par commit (utile pour appliquer tâche par tâche), utilisez :
   ```bash
   git format-patch origin/main --stdout > serie-de-patchs.patch
   ```
5. Pour exporter l'état complet des fichiers de la branche :
   ```bash
   git archive --format=zip HEAD > branche.zip
   ```
   Le fichier `branche.zip` contiendra tous les fichiers tels qu'ils existent actuellement sur la branche.

## Bonnes pratiques

- Créez une branche dédiée par ensemble de tâches. Cela facilite l'inspection, la revue et l'extraction des modifications.
- Nettoyez l'historique (via `git rebase -i` ou `git squash`) avant d'exporter si vous souhaitez fusionner plusieurs petits commits en un seul diff cohérent.
- Documentez chaque tâche dans la description du Pull Request pour que le diff reste compréhensible une fois exporté.
