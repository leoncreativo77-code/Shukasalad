use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

// Copia un archivo (ya elegido por el usuario vía el diálogo nativo de
// selección de archivos, del lado JS) al directorio de datos de la app, bajo
// <app_data_dir>/<subdir>/<uuid>.<ext>. Evita tener que exponer el plugin fs
// con permisos de lectura de rutas arbitrarias: el único dato que cruza
// desde JS es una ruta que el propio sistema operativo ya vetó al usuario a
// través del diálogo nativo.
#[tauri::command]
fn copy_app_asset(app: tauri::AppHandle, src: String, subdir: String) -> Result<String, String> {
  let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
  let target_dir = data_dir.join(&subdir);
  std::fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

  let src_path = std::path::Path::new(&src);
  let ext = src_path
    .extension()
    .and_then(|e| e.to_str())
    .unwrap_or("png");
  let filename = format!("{}.{}", uuid::Uuid::new_v4(), ext);
  let dest_path = target_dir.join(&filename);

  std::fs::copy(&src_path, &dest_path).map_err(|e| e.to_string())?;

  Ok(dest_path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let migrations = vec![
    Migration {
      version: 1,
      description: "init",
      sql: include_str!("../migrations/0001_init.sql"),
      kind: MigrationKind::Up,
    },
    Migration {
      version: 2,
      description: "admin_features",
      sql: include_str!("../migrations/0002_admin_features.sql"),
      kind: MigrationKind::Up,
    },
  ];

  tauri::Builder::default()
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:pos.db", migrations)
        .build(),
    )
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![copy_app_asset])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
