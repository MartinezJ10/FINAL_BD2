import { sql, makeConnection } from "../database/database.js";
import { queries } from "../database/queries.js";

/*
Funcion que obtiene la pagina principal de entrada, verifica si la DB se conecta correctamente
Obtiene las tablas de la DB a manipular
*/
export const getIndex = async (req, res) => {
  try {
    const pool = await makeConnection();
    const result = await pool.request().query(queries.OBTENER_TABLAS);

    res.render('index', { data: result.recordset });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).send('Error connecting to the database');
  }
}

/*
Envia la consulta en formulario de input manual
*/
export const consultaManual = async (req, res) => {
  try {
    const queryForm = req.body.consulta.trim();

    const pool = await makeConnection();
    const sendQueryInsert = await pool.request().query(queryForm);

    //Confirmar si la insercion funciona
    if (sendQueryInsert.rowsAffected[0] > 0) {
      res.status(200).json('Inserción completada con éxito.')
    } else {
      res.status(200).json('La consulta se ejecutó, pero no se afectaron filas.');
    }

  } catch (error) {
    res.status(500).json({ error: `"Error: ${error}"` });

  }
}


/*
Envia las columnas de la tabla seleccionada
*/
export const obtenerTablaSeleccionada = async (req, res) => {
  try {
    const pool = await makeConnection()

    const TABLE_NAME = req.query.tabla;

    //obtener columnas de la tabla seleccionada de forma parametrica
    const qryObtenerColumnasTabla = await pool.request()
      .input("TABLE_NAME", sql.VarChar, TABLE_NAME)
      .query(queries.OBTENER_COLUMNAS_TABLA);

    req.session.tablaOrigen = TABLE_NAME;

    const columnas = qryObtenerColumnasTabla.recordset
    res.render('seleccionarColumnas.ejs', { columnas, TABLE_NAME })


  } catch (error) {
    res.status(500).json({ error: `"Error: ${error}"` });

  }
}


/*
  Guardar las columnar que se seleccionaron como origen
*/
export const enviarColumnasSeleccionadas = async (req, res) => {
  try {
    const pool = await makeConnection()

    const TABLE_NAME = req.body.tabla;
    const columnas = req.body.columns;

    //guardar datos en session para utilizarla a lo largo de la ejecucion del programa
    req.session.columnasOrigen = columnas;

    res.render('escojerTransformacion.ejs', { TABLE_NAME, columnas })

  } catch (error) {
    res.status(500).json({ error: `"Error: ${error}"` });

  }
}

/*
  Seleccionar una tabla de destino considerando la operacion seleccionada, y los campos a modificar
  construir la funcion sql que va a transformar la consulta seleccionada
*/
export const seleccionarDestino = async (req, res) => {
  try {
    const pool = await makeConnection()
    const result = await pool.request().query(queries.OBTENER_TABLAS);

    const urlDetails = req.query
    req.session.operacion = req.query.operacion;
    req.session.columnasOperacion = req.query.columnas

    let camposUtilizables = [];
    let columasOperacion = req.session.columnasOperacion;
    let columnasOrigen = req.session.columnasOrigen;
    let operacionAplicada = '';

    if (columasOperacion != null) {
      //verificar si la columna a operar es un arreglo sino convertirlo en uno(caso que solo sea una columna)
      if (!Array.isArray(columasOperacion)) {
        columasOperacion = [columasOperacion]
      }

      /*agregar las columnas de origen a los CamposUtilizables solo los que no sean coincidentes
        con los campos a operar, ya que esos se tienen que modificar con la funcion SQL
      */
      camposUtilizables.push(...columnasOrigen.filter(x => !columasOperacion.includes(x)));


      switch (req.session.operacion) {
        case '1': // Minúsculas
          operacionAplicada = columasOperacion.map(col => `LOWER(${col})`);
          break;
        case '2': // Mayúsculas
          operacionAplicada = columasOperacion.map(col => `UPPER(${col})`);
          break;
        case '3': // Año
          operacionAplicada = columasOperacion.map(col => `YEAR(${col})`);
          break;
        case '4': // Mes
          operacionAplicada = columasOperacion.map(col => `MONTH(${col})`);
          break;
        case '5': // Día
          operacionAplicada = columasOperacion.map(col => `DAY(${col})`);
          break;
        case '6': // Hora
          operacionAplicada = columasOperacion.map(col => `DATEPART(HOUR, ${col})`);
          break;
        case '7':
          /*
            hacer la concatenacion de forma directa y usando COALESCE() para el manejo de valores null
          */
          operacionAplicada = columasOperacion
            .map(col => `COALESCE(${col}, '')`)
            .join(" + ' ' + ");
          break;

        case '8':
        default:
          /* 
            Los campos utilizables seran los de origen, es decir se insertara sin transformacion alguna
          */
          camposUtilizables.push(...columnasOrigen);

          break;
      }

      if (Array.isArray(operacionAplicada)) {
        camposUtilizables.push(...operacionAplicada); // Expandir el arreglo de operacionAplicada y agregarlo a camposUtilizables
      } else {
        camposUtilizables.push(operacionAplicada); // Si no es un arreglo (por ejemplo, caso 7), push directamente
      }

    } else camposUtilizables.push(...columnasOrigen); // si no hay operaciones entonces se los valores originales

    //Actualizar la session
    req.session.camposUtilizables = camposUtilizables;
    res.render('escojerDestino.ejs', { urlDetails, data: result.recordset })

  } catch (error) {
    res.status(500).json({ error: `"Error: ${error}"` });

  }
}

/*
    Enviar los campos utilizables con las transformaciones listas
    para emparejarlos con los de destino

*/
export const seleccionarColumnaDestino = async (req, res) => {
  try {
    const pool = await makeConnection()

    const TABLE_DESTINATION_NAME = req.query.tabla;
    
    //Obtener columnas de tabla destino
    const qryObtenerColumnasTabla = await pool.request()
      .input("TABLE_NAME", sql.VarChar, TABLE_DESTINATION_NAME)
      .query(queries.OBTENER_COLUMNAS_TABLA);

    req.session.tablaDestino = TABLE_DESTINATION_NAME;

    const columnas = qryObtenerColumnasTabla.recordset;
    
    //actualizar session
    const camposUtilizables = req.session.camposUtilizables

    res.render('escojerColumnasDestino.ejs', { columnas, TABLE_DESTINATION_NAME, camposUtilizables })

  } catch (error) {
    res.status(500).json({ error: `"Error: ${error}"` });

  }
}

/*
  Obtener un arreglo asociativo con la correspondencia del campo de origen con el campo de destino
  considerando las modifcaciones hechas previamente, parsearlo como JSON para la paridad ORIGEN -> DESTINO 
*/
export const enviarColumnasDestino = async (req, res) => {
  try {
    const correspondencias = req.body.correspondenciasJson;

    const JSONCorrespondencia = JSON.parse(correspondencias)

    //actualizar la session
    req.session.correspondencia = JSONCorrespondencia;

    const dataConsulta = req.session;
    aplicarConsulta(dataConsulta, req, res);

  } catch (error) {
    res.status(500).json({ error: `"Error: ${error}"` });

  }

}

/*
  Construir una consulta manteniendo el orden de correspondencia entre los campos de insercion
  y los campos de seleccion, asegurarse que solo se inserten valores nuevos con la condicional
  entre llaves primarias
*/
const aplicarConsulta = async (dataConsulta, req, res) => {
  try {
    const pool = await makeConnection()
    const columnasDestino = Object.keys(dataConsulta.correspondencia);
    const columnasOrigen = Object.values(dataConsulta.correspondencia);

    const pkMap = {
      destino: await obtenerPK(dataConsulta.tablaDestino, pool),
      origen: await obtenerPK(dataConsulta.tablaOrigen, pool)
    }
    const condicionesPK = `destino.${pkMap.destino} = origen.${pkMap.origen}`

    const queryInsert = `
      INSERT INTO ${dataConsulta.tablaDestino} (${columnasDestino.join(',')})
      SELECT ${columnasOrigen.join(',')}
      FROM ${dataConsulta.tablaOrigen} origen
      WHERE NOT EXISTS (
        SELECT 1
        FROM ${dataConsulta.tablaDestino} destino
        WHERE ${condicionesPK}
      );
      `;

      //Ejecutar la consulta armada
    const sendSelectInsert = await pool.request()
      .query(queryInsert);

    //Confirmar la ejecucion
    if (sendSelectInsert.rowsAffected[0] > 0) {
      res.status(200).json('Inserción completada con éxito.')
    } else {
      res.status(200).json('La consulta se ejecutó, pero no se afectaron filas.');
    }

  } catch (error) {
    res.status(500).json({ error: `"Error: ${error}"` });
  }
}

/*
Funcion de utileria para obtener la PK de alguna tabla y devolver su valor

*/
const obtenerPK = async (tabla, pool) => {
  const queryPrimaryKey = `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE OBJECTPROPERTY(OBJECT_ID(CONSTRAINT_SCHEMA + '.' + CONSTRAINT_NAME), 'IsPrimaryKey') = 1
      AND TABLE_NAME = '${tabla}';
  `;

  const result = await pool.request().query(queryPrimaryKey);
  return result.recordset.map(row => row.COLUMN_NAME);
}
