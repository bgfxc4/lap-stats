type Config = {
    login_hash: string,
    race_time_secs: number,
    race_time_startup_secs: number,
    structure: {[key: string]: string[]}
}

export const config: Config = {
   login_hash: "6104fa58f7eef211029dc7169f0660ef13813906506646f9c88db534ff9af6e3c1013cdb79bbd6959971abbbddb924978083a56fed1bb36aaf1d12980044c9d3", // pepper: "qwe:lap-stats"
   race_time_secs: 60,
   race_time_startup_secs: 10,
   structure: {
       "screen1": [
            "screen1_scanner1",
       ],
       "screen2": [
            "screen2_scanner1",
       ],
       "screen3": [
            "screen3_scanner1",
       ],
       "screen4": [
            "screen4_scanner1",
       ]
   },
}
