// Root "/" se sada servira izravno kao statični fajl kroz Firebase Hosting
// (kao i svaka druga stranica), bez prolaska kroz Cloud Function. Ranije je
// ovdje postojala "renderBot" funkcija (Express + prerender-node) koja je
// presretala "/" radi bot-prerenderinga preko Prerender.io, uz sinkroniziranu
// kopiju u functions/public/index.html - ta cijela mehanika je uklonjena.
