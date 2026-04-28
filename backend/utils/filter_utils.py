from flask import request

def get_filter_params():
    """
    Obtiene y procesa los parámetros de filtro de la request
    
    Returns:
        dict: Diccionario con los parámetros de filtro
    """
    filters = {}
    
    # Filtros comunes
    if request.args.get('search'):
        filters['search'] = request.args.get('search').strip()
    
    if request.args.get('estado'):
        filters['estado'] = request.args.get('estado').strip()
    
    if request.args.get('tutor_id'):
        filters['tutor_id'] = request.args.get('tutor_id', type=int)
    
    if request.args.get('rol'):
        filters['rol'] = request.args.get('rol').strip()
    
    if 'activo' in request.args:
        # Convertir string a boolean
        activo_str = request.args.get('activo').lower()
        if activo_str in ['true', '1', 'yes']:
            filters['activo'] = 1
        elif activo_str in ['false', '0', 'no']:
            filters['activo'] = 0
    
    if request.args.get('anio'):
        filters['anio'] = request.args.get('anio', type=int)
    
    if request.args.get('anio_desde'):
        filters['anio_desde'] = request.args.get('anio_desde', type=int)
    
    if request.args.get('anio_hasta'):
        filters['anio_hasta'] = request.args.get('anio_hasta', type=int)
    
    return filters



# Whitelist de columnas válidas permitidas en cláusulas WHERE.
# Solo estas columnas (con o sin prefijo de tabla) pueden usarse en filtros.
_ALLOWED_COLUMNS = {
    'activo', 'anio', 'estado', 'tutor_id', 'rol', 'alumno_id',
    'nombre', 'email',
    'u.activo', 'u.nombre', 'u.email',
    't.estado', 't.tutor_id', 't.alumno_id', 't.anio',
    # Columnas de ejemplos
    'titulo', 'nombre_estudiante', 'tutor',
}

def _validate_column(col: str) -> str:
    """
    Valida que el nombre de columna esté en la whitelist.
    Lanza ValueError si no es válido, para evitar SQL injection.
    """
    if col not in _ALLOWED_COLUMNS:
        raise ValueError(f"Columna no permitida en filtro: '{col}'")
    return col


def build_where_clause(filters, allowed_filters):
    """
    Construye una cláusula WHERE SQL basada en los filtros.
    Los nombres de columna se validan contra una whitelist estricta
    para evitar SQL injection.

    Args:
        filters: Diccionario con los filtros activos
        allowed_filters: Diccionario de filtros permitidos para este endpoint

    Returns:
        tuple: (where_clause, params)
    """
    conditions = []
    params = []

    for key, value in filters.items():
        if key not in allowed_filters:
            continue

        if key == 'search':
            # Búsqueda en múltiples campos — validar cada campo contra whitelist
            search_fields = allowed_filters[key]
            validated_fields = [_validate_column(f) for f in search_fields]
            search_conditions = [f"{field} LIKE ?" for field in validated_fields]
            conditions.append(f"({' OR '.join(search_conditions)})")
            params.extend([f"%{value}%" for _ in validated_fields])

        elif key in ['anio_desde', 'anio_hasta']:
            # Rango de años — columna fija, sin interpolación de input
            if key == 'anio_desde':
                conditions.append("anio >= ?")
                params.append(value)
            else:
                conditions.append("anio <= ?")
                params.append(value)

        else:
            # Filtro exacto — validar nombre de columna contra whitelist
            col = _validate_column(allowed_filters[key] if isinstance(allowed_filters[key], str) else key)
            conditions.append(f"{col} = ?")
            params.append(value)

    where_clause = " AND ".join(conditions) if conditions else "1=1"

    return where_clause, params