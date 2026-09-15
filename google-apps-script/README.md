# חיבור טופס הלקוחות לגוגל שיטס

הגיליון: [לקוחות – ארועים](https://docs.google.com/spreadsheets/d/1Jq29xxus0pT_VYrJknQsYforvXMXb8v_e2S2uND5N-s/edit)

## התקנה (פעם אחת, כ-3 דקות)

1. פתחו את הגיליון ← **תוספים (Extensions) ← Apps Script**.
2. מחקו את הקוד הקיים והדביקו את כל התוכן של `Code.gs`. שמרו.
3. **פריסה (Deploy) ← פריסה חדשה (New deployment)**:
   - סוג: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. אשרו את ההרשאות, והעתיקו את כתובת ה-Web app (מסתיימת ב-`/exec`).
5. ב-`index.html` הדביקו את הכתובת בטופס:
   ```html
   <form class="signup-form" data-signup-form data-endpoint="https://script.google.com/macros/s/XXXX/exec" novalidate>
   ```
6. שמרו, העלו לגיטהאב, ושלחו טופס ניסיון. שורה חדשה תופיע בלשונית **לקוחות**.

## מה נשמר

| תאריך הרשמה | שם מלא | טלפון | מקור |
|---|---|---|---|

- הטלפון נשמר כטקסט (ה-0 בהתחלה נשמר), ו-`972+` הופך ל-`0`.
- אם אותו מספר נרשם שוב, השורה הקיימת מתעדכנת ולא נוצרת כפילות.
- שדה נסתר חוסם הרשמות של בוטים.

## עדכון הקוד

אחרי שינוי ב-`Code.gs`: **Deploy ← Manage deployments ← עריכה ← Version: New version**. כך כתובת ה-`/exec` נשארת אותה כתובת.
