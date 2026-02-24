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
    
    if request.args.get('activo') is not None:
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


def build_where_clause(filters, allowed_filters):
    """
    Construye una cláusula WHERE SQL basada en los filtros
    
    Args:
        filters: Diccionario con los filtros activos
        allowed_filters: Lista de filtros permitidos para este endpoint
        
    Returns:
        tuple: (where_clause, params)
    """
    conditions = []
    params = []
    
    for key, value in filters.items():
        if key not in allowed_filters:
            continue
        
        if key == 'search':
            # Búsqueda en múltiples campos (se define por endpoint)
            search_fields = allowed_filters[key]
            search_conditions = [f"{field} LIKE ?" for field in search_fields]
            conditions.append(f"({' OR '.join(search_conditions)})")
            # Agregar el mismo valor para cada campo de búsqueda
            params.extend([f"%{value}%" for _ in search_fields])
        
        elif key in ['anio_desde', 'anio_hasta']:
            # Rango de años
            if key == 'anio_desde':
                conditions.append("anio >= ?")
                params.append(value)
            else:
                conditions.append("anio <= ?")
                params.append(value)
        
        else:
            # Filtro exacto
            conditions.append(f"{key} = ?")
            params.append(value)
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    
    return where_clause, params