import { Router } from "express";
import { getIndex, consultaManual,obtenerTablaSeleccionada, enviarColumnasSeleccionadas,
        seleccionarDestino,seleccionarColumnaDestino,enviarColumnasDestino
 } from "../controllers/index.controller.js"

const router = Router();

router.get('/', getIndex)
router.post('/consultaManual', consultaManual)

router.get('/tablaSeleccionada', obtenerTablaSeleccionada);

router.post('/enviarColumnas', enviarColumnasSeleccionadas);

router.get('/seleccionarDestino', seleccionarDestino);

router.get('/seleccionarColumnaDestino', seleccionarColumnaDestino);

router.post('/enviarColumnasDestino', enviarColumnasDestino)

export default router;